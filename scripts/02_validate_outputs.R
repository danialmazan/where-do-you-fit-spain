suppressPackageStartupMessages(library(jsonlite))

lookup_path <- "public/data/profile-lookups.json"
context_path <- "public/data/context.json"
if (!file.exists(lookup_path) || !file.exists(context_path)) stop("Missing generated outputs; run scripts/01_build_lookups.R")

lookups <- fromJSON(lookup_path, simplifyDataFrame = TRUE)
context <- fromJSON(context_path, simplifyDataFrame = TRUE)
records <- lookups$records
meta <- lookups$metadata
if (!is.data.frame(records)) {
  records <- as.data.frame(records, stringsAsFactors = FALSE)
  names(records) <- unlist(lookups$columns)
}

stopifnot(nrow(records) > 1000)
stopifnot(meta$analytic_sample > 50000)
stopifnot(meta$weighted_adult_population > 40000000, meta$weighted_adult_population < 42000000)
stopifnot(context$salary_sample_n > 20000)
stopifnot(nrow(context$age) >= 90)
stopifnot(nrow(context$regions) == 19)
stopifnot(all(is.na(records$p[records$q == "suppressed"])))
stopifnot(all(!is.na(records$p[records$q != "suppressed"])))
stopifnot(all(as.numeric(records$n[records$q == "standard"]) >= 50))
stopifnot(all(as.numeric(records$ne[records$q == "standard"]) >= 30))
stopifnot(all(records$q[records$v != "exact"] == "standard"))

payload_bytes <- file.info(c(lookup_path, context_path))$size
if (sum(payload_bytes) > 20e6) stop("Public data payload exceeds 20 MB uncompressed")

cat("Validated aggregate outputs\n")
cat("Lookup rows:", nrow(records), "\n")
cat("Adult weighted universe:", round(meta$weighted_adult_population), "\n")
cat("Public JSON bytes:", sum(payload_bytes), "\n")
