suppressPackageStartupMessages({
  library(data.table)
  library(jsonlite)
})

ecv_zip <- "data/raw/datos_2025.zip"
census_file <- "data/raw/census_68519_2025.csv"
if (!file.exists(ecv_zip)) stop("Missing ", ecv_zip, ". Run scripts/00_download_sources.R first.")
if (!file.exists(census_file)) stop("Missing ", census_file, ". Run scripts/00_download_sources.R first.")

dir.create("public/data", recursive = TRUE, showWarnings = FALSE)
dir.create("data/audit", recursive = TRUE, showWarnings = FALSE)

load_part <- function(part) {
  scratch <- tempfile(paste0("ecv_", part, "_"))
  dir.create(scratch)
  on.exit(unlink(scratch, recursive = TRUE), add = TRUE)
  nested_name <- paste0("ECV_", part, "_2025.zip")
  unzip(ecv_zip, files = nested_name, exdir = scratch)
  nested <- file.path(scratch, nested_name)
  rdata_name <- paste0("R/ECV_", part, "_2025.RData")
  unzip(nested, files = rdata_name, exdir = scratch)
  env <- new.env(parent = emptyenv())
  load(file.path(scratch, rdata_name), envir = env)
  as.data.table(env$df_micro)
}

message("Loading ECV 2025 files...")
d <- load_part("Td")
r <- load_part("Tr")
h <- load_part("Th")
p <- load_part("Tp")

stopifnot(nrow(d) == nrow(h), !anyDuplicated(d$DB030), !anyDuplicated(h$HB030))
stopifnot(!anyDuplicated(r$RB030), !anyDuplicated(p$PB030))

setnames(d, "DB030", "household_id")
setnames(h, "HB030", "household_id")
setnames(r, "RB030", "person_id")
setnames(p, "PB030", "person_id")

people <- merge(
  p[, .(
    person_id,
    weight = PB040,
    education_raw = PE041,
    activity_raw = PL032,
    job_class_raw = PL040A,
    gross_pay = PY010G,
    gross_pay_flag = PY010G_F
  )],
  r[, .(person_id, age = RB082)],
  by = "person_id",
  all.x = TRUE
)
people[, household_id := person_id %/% 100]
people <- merge(people, d[, .(household_id, region = DB040)], by = "household_id", all.x = TRUE)
people <- merge(
  people,
  h[, .(household_id, household_raw = HX060, household_size = HX040)],
  by = "household_id",
  all.x = TRUE
)

if (anyNA(people$age) || anyNA(people$region)) {
  stop("Unexpected missing age or region after ECV person-household joins")
}

people <- people[age >= 18 & !is.na(weight) & weight > 0]

people[, age_band := fcase(
  age < 25, "18-24",
  age < 30, "25-29",
  age < 35, "30-34",
  age < 40, "35-39",
  age < 45, "40-44",
  age < 50, "45-49",
  age < 55, "50-54",
  age < 60, "55-59",
  age < 65, "60-64",
  age < 75, "65-74",
  age < 86, "75-85",
  default = "86+"
)]

people[, activity := fcase(
  activity_raw == "1" & job_class_raw == "3", "employee",
  activity_raw == "1" & job_class_raw %chin% c("1", "2", "4"), "self_employed",
  activity_raw == "2", "unemployed",
  activity_raw == "3", "retired",
  activity_raw == "5", "student",
  activity_raw %chin% c("4", "6", "8"), "other_inactive",
  default = NA_character_
)]

people[, education := fcase(
  education_raw %chin% c("000", "100"), "primary",
  education_raw == "200", "lower_secondary",
  education_raw %chin% c("340", "344", "350", "353", "354", "450"), "upper_secondary",
  education_raw == "500", "tertiary",
  default = NA_character_
)]

people[, household := fcase(
  household_raw %chin% as.character(1:6), "alone",
  household_raw %chin% c("7", "8"), "two_no_children",
  household_raw == "10", "one_parent",
  household_raw %chin% c("11", "12", "13"), "two_with_children",
  household_raw == "9", "other_no_children",
  household_raw == "14", "other_with_children",
  default = NA_character_
)]

people[, income := fcase(
  activity == "employee" & gross_pay > 0 & gross_pay < 15000, "under_15k",
  activity == "employee" & gross_pay >= 15000 & gross_pay < 25000, "15_25k",
  activity == "employee" & gross_pay >= 25000 & gross_pay < 40000, "25_40k",
  activity == "employee" & gross_pay >= 40000 & gross_pay < 60000, "40_60k",
  activity == "employee" & gross_pay >= 60000, "60k_plus",
  default = NA_character_
)]

people[, age_wide := fcase(
  age < 30, "18-29",
  age < 40, "30-39",
  age < 50, "40-49",
  age < 60, "50-59",
  age < 75, "60-74",
  default = "75+"
)]
people[, income_wide := fcase(
  income %chin% c("under_15k", "15_25k"), "under_25k",
  income %chin% c("25_40k", "40_60k"), "25_60k",
  income == "60k_plus", "60k_plus",
  default = NA_character_
)]

required <- c("age_band", "activity", "education", "household", "region")
complete_share <- mean(complete.cases(people[, ..required]))
if (complete_share < 0.97) stop("Unexpectedly low complete-case share: ", round(complete_share, 4))

weighted_quantile <- function(x, w, probs) {
  keep <- is.finite(x) & is.finite(w) & w > 0
  x <- x[keep]
  w <- w[keep]
  ord <- order(x)
  x <- x[ord]
  cw <- cumsum(w[ord]) / sum(w)
  vapply(probs, function(prob) x[which(cw >= prob)[1]], numeric(1))
}

weighted_groups <- function(dt, by) {
  dt[, .(
    sample_n = .N,
    estimate = sum(weight),
    weight_sq = sum(weight^2),
    effective_n = sum(weight)^2 / sum(weight^2)
  ), by = by]
}

dimensions <- c("age_band", "activity", "education", "household", "income", "region")
bits <- setNames(2^(seq_along(dimensions) - 1), dimensions)
lookup_parts <- vector("list", 2^length(dimensions))

message("Building joint lookup lattice...")
for (mask in 0:(2^length(dimensions) - 1)) {
  selected <- dimensions[bitwAnd(mask, bits) > 0]
  source <- people
  if (length(selected)) source <- source[complete.cases(source[, ..selected])]
  grouped <- if (length(selected)) weighted_groups(source, selected) else weighted_groups(source, character())
  grouped[, mask := mask]
  for (name in dimensions) if (!name %in% names(grouped)) grouped[, (name) := NA_character_]
  grouped[, quality := fifelse(
    sample_n < 20 | effective_n < 15, "suppressed",
    fifelse(sample_n < 50 | effective_n < 30, "low", "standard")
  )]
  grouped[quality == "suppressed", estimate := NA_real_]
  lookup_parts[[mask + 1]] <- grouped[, c(
    "mask", dimensions, "estimate", "sample_n", "effective_n", "weight_sq", "quality"
  ), with = FALSE]
}

lookups <- rbindlist(lookup_parts, use.names = TRUE, fill = TRUE)
lookups[, variant := "exact"]

build_fallback <- function(variant) {
  age_source <- if (variant %chin% c("age", "both")) "age_wide" else "age_band"
  income_source <- if (variant %chin% c("income", "both")) "income_wide" else "income"
  mapped <- c(age_source, "activity", "education", "household", income_source, "region")
  parts <- list()
  for (mask in 0:(2^length(dimensions) - 1)) {
    if (variant == "age" && bitwAnd(mask, bits[["age_band"]]) == 0) next
    if (variant == "income" && bitwAnd(mask, bits[["income"]]) == 0) next
    if (variant == "both" && (bitwAnd(mask, bits[["age_band"]]) == 0 || bitwAnd(mask, bits[["income"]]) == 0)) next
    selected_positions <- which(bitwAnd(mask, bits) > 0)
    selected_source <- mapped[selected_positions]
    source <- people[complete.cases(people[, ..selected_source])]
    grouped <- weighted_groups(source, selected_source)
    setnames(grouped, selected_source, dimensions[selected_positions])
    grouped[, mask := mask]
    for (name in dimensions) if (!name %in% names(grouped)) grouped[, (name) := NA_character_]
    grouped[, quality := fifelse(
      sample_n < 20 | effective_n < 15, "suppressed",
      fifelse(sample_n < 50 | effective_n < 30, "low", "standard")
    )]
    grouped <- grouped[quality == "standard"]
    grouped[, variant := variant]
    parts[[length(parts) + 1]] <- grouped[, c(
      "mask", dimensions, "estimate", "sample_n", "effective_n", "weight_sq", "quality", "variant"
    ), with = FALSE]
  }
  rbindlist(parts, use.names = TRUE, fill = TRUE)
}

fallbacks <- rbindlist(lapply(c("age", "income", "both"), build_fallback), use.names = TRUE, fill = TRUE)
lookups <- rbindlist(list(lookups, fallbacks), use.names = TRUE, fill = TRUE)
setorder(lookups, mask, age_band, activity, education, household, income, region)

salary <- people[activity == "employee" & gross_pay > 0 & is.finite(gross_pay)]
probs <- seq(0.01, 0.99, 0.01)
income_quantiles <- data.table(
  percentile = as.integer(probs * 100),
  value = weighted_quantile(salary$gross_pay, salary$weight, probs)
)
income_histogram <- salary[, .(estimate = sum(weight)), by = .(
  lower = pmin(floor(gross_pay / 5000) * 5000, 100000)
)]
income_histogram[, upper := fifelse(lower == 100000, NA_real_, lower + 5000)]
setorder(income_histogram, lower)

marginal_share <- function(variable, by_age = TRUE) {
  vars <- c(if (by_age) "age_band", variable)
  out <- people[complete.cases(people[, ..vars]), .(estimate = sum(weight)), by = vars]
  if (by_age) {
    out[, denominator := sum(estimate), by = age_band]
  } else {
    out[, denominator := sum(estimate)]
  }
  out[, share := estimate / denominator]
  out
}

activity_context <- rbind(
  marginal_share("activity", TRUE)[, scope := "age"],
  marginal_share("activity", FALSE)[, `:=`(age_band = NA_character_, scope = "national")],
  fill = TRUE
)
education_context <- rbind(
  marginal_share("education", TRUE)[, scope := "age"],
  marginal_share("education", FALSE)[, `:=`(age_band = NA_character_, scope = "national")],
  fill = TRUE
)
household_context <- rbind(
  marginal_share("household", TRUE)[, scope := "age"],
  marginal_share("household", FALSE)[, `:=`(age_band = NA_character_, scope = "national")],
  fill = TRUE
)

message("Parsing Census 2025 context...")
census <- fread(census_file, sep = ";", encoding = "UTF-8", na.strings = c("", ".."))
setnames(census, sub("^\\ufeff", "", names(census)))
census[, count := as.numeric(gsub("\\.", "", Total))]
census_2025 <- census[Periodo == 2025 & Sexo == "Total" & Nacionalidad == "Total"]
national_census_2025 <- census_2025[["Total Nacional"]] == "Total Nacional" &
  is.na(census_2025[["Comunidades y Ciudades Autónomas"]]) &
  is.na(census_2025[["Provincias"]])

age_label <- census_2025[["Edad"]]
age_number <- suppressWarnings(as.integer(sub(" .*", "", age_label)))
age_census <- data.table(age = age_number[national_census_2025], count = census_2025$count[national_census_2025])
age_census <- age_census[!is.na(age) & age >= 0]
age_census <- age_census[, .(count = sum(count, na.rm = TRUE)), by = age]
setorder(age_census, age)

region_name <- census_2025[["Comunidades y Ciudades Autónomas"]]
province_name <- census_2025[["Provincias"]]
region_census <- data.table(region_name = region_name, province_name = province_name, age_label = age_label, count = census_2025$count)
region_census <- region_census[!is.na(region_name) & is.na(province_name) & age_label == "Todas las edades"]

region_codes <- c(
  "01 Andalucía" = "ES61", "02 Aragón" = "ES24", "03 Asturias, Principado de" = "ES12",
  "04 Balears, Illes" = "ES53", "05 Canarias" = "ES70", "06 Cantabria" = "ES13",
  "07 Castilla y León" = "ES41", "08 Castilla - La Mancha" = "ES42", "09 Cataluña" = "ES51",
  "10 Comunitat Valenciana" = "ES52", "11 Extremadura" = "ES43", "12 Galicia" = "ES11",
  "13 Madrid, Comunidad de" = "ES30", "14 Murcia, Región de" = "ES62",
  "15 Navarra, Comunidad Foral de" = "ES22", "16 País Vasco" = "ES21", "17 Rioja, La" = "ES23",
  "18 Ceuta" = "ES63", "19 Melilla" = "ES64"
)
region_census[, region := unname(region_codes[region_name])]
region_census <- region_census[!is.na(region), .(region, count)]

metadata <- list(
  generated = format(Sys.time(), tz = "UTC", usetz = TRUE),
  survey = "ECV 2025",
  income_reference_year = 2024,
  universe = "Adults aged 18+ living in private households in Spain",
  sample_people_all = nrow(r),
  sample_people_detailed = nrow(p),
  sample_households = nrow(h),
  analytic_sample = nrow(people),
  weighted_adult_population = sum(people$weight),
  complete_share = complete_share,
  dimensions = as.list(bits),
  reliability = list(standard_raw_n = 50, standard_effective_n = 30, suppress_raw_n = 20, suppress_effective_n = 15)
)

compact <- copy(lookups)
compact[, weight_sq := NULL]
setnames(
  compact,
  c("age_band", "activity", "education", "household", "income", "region", "estimate", "sample_n", "effective_n", "quality", "variant"),
  c("a", "t", "e", "h", "i", "r", "p", "n", "ne", "q", "v")
)
compact[, `:=`(p = round(p), ne = round(ne, 1))]

write_json(
  list(metadata = metadata, columns = names(compact), records = compact),
  "public/data/profile-lookups.json",
  dataframe = "values", auto_unbox = TRUE, na = "null", digits = 6, pretty = FALSE
)

write_json(
  list(
    metadata = metadata,
    age = age_census,
    regions = region_census,
    activity = activity_context,
    education = education_context,
    household = household_context,
    income_quantiles = income_quantiles,
    income_histogram = income_histogram,
    salary_population = sum(salary$weight),
    salary_sample_n = nrow(salary)
  ),
  "public/data/context.json",
  dataframe = "rows", auto_unbox = TRUE, na = "null", digits = 6, pretty = FALSE
)

audit <- data.table(
  metric = c(
    "households", "all_person_records", "detailed_person_records", "adult_analytic_records",
    "weighted_adult_population", "complete_case_share", "salary_records", "lookup_rows",
    "suppressed_lookup_rows", "low_reliability_lookup_rows"
  ),
  value = c(
    nrow(h), nrow(r), nrow(p), nrow(people), sum(people$weight), complete_share,
    nrow(salary), nrow(lookups), sum(lookups$quality == "suppressed"), sum(lookups$quality == "low")
  )
)
fwrite(audit, "data/audit/build_metrics.csv")

message("Wrote ", nrow(lookups), " aggregate lookup rows and context data.")
