options(timeout = 600)

dir.create("data/raw", recursive = TRUE, showWarnings = FALSE)
url <- "https://www.ine.es/ftp/microdatos/ecv/ecv_b2013/datos_2025.zip"
dest <- "data/raw/datos_2025.zip"

if (!file.exists(dest)) {
  message("Downloading ECV 2025 from INE...")
  download.file(url, dest, mode = "wb", method = "libcurl")
}

checksum <- unname(tools::md5sum(dest))
writeLines(
  c(
    paste("source_url:", url),
    paste("downloaded_utc:", format(Sys.time(), tz = "UTC", usetz = TRUE)),
    paste("md5:", checksum)
  ),
  "data/raw/datos_2025.source.txt"
)

message("ECV archive ready: ", dest)

census_url <- "https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/68519.csv?nocab=1"
census_dest <- "data/raw/census_68519_2025.csv"
if (!file.exists(census_dest)) {
  message("Downloading Census 2025 age and region table from INE...")
  download.file(census_url, census_dest, mode = "wb", method = "libcurl")
}

message("Census table ready: ", census_dest)
