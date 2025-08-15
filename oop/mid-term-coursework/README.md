# Weather Analysis Toolkit

Midterm Assignment for CM2005 Object-Oriented Programming.
This toolkit loads hourly temperature data from a CSV file, filters and aggregates it into candlestick data per specified period (year, month, day), renders an ASCII-based candlestick chart, and optionally predicts the next average temperature via simple linear regression.

---

## 📁 Project Structure

```
./
├── CMakeLists.txt            # Build configuration
├── data/
│   └── sample.csv            # Example CSV dataset
└── src/
    ├── main.cpp              # CLI entry point and orchestration
    ├── Candlestick.h/.cpp    # Candlestick model
    ├── WeatherLoader.h/.cpp  # CSV parsing and data loading
    ├── DataFilter.h/.cpp     # Date and temperature filtering
    ├── CandlestickBuilder.h/.cpp  # Aggregation logic
    ├── ASCIIPlotter.h/.cpp   # ASCII chart rendering
    ├── Predictor.h/.cpp      # Prediction algorithm
    └── ...
```

---

## ⚙️ Build Instructions

Make sure you have a C++17 compiler and CMake installed.

```bash
# 1. Create and enter build directory
mkdir build && cd build

# 2. Generate build system
cmake ..

# 3. Compile
make
```

This will produce the executable `weather_toolkit` in `build/`.

---

## 🏃 Usage

````bash
# Syntax
./weather_toolkit <csv-file> <COUNTRY_CODE> [OPTIONS]

# Required arguments
  <csv-file>        Path to CSV with columns `utc_timestamp` and `<COUNTRY_CODE>_temperature`
  <COUNTRY_CODE>    Two-letter code (e.g., GB, DE) matching the CSV header prefix

# Optional flags
  --from YYYY-MM-DD   Start date filter (inclusive)
  --to   YYYY-MM-DD   End date filter (inclusive)
  --minT <value>      Minimum temperature filter
  --maxT <value>      Maximum temperature filter
  --period <period>   Aggregation period: `year`, `month`, or `day` (default: `month`)
  --plot              Render ASCII candlestick chart
  --predict           Predict next average temperature via linear regression

# Example
```bash
./weather_toolkit ../data/sample.csv GB --period month --plot --predict
````

This command:

1. Loads `GB_temperature` from `sample.csv`.
2. Aggregates data by month into candlesticks.
3. Displays the ASCII chart.
4. Prints the predicted next average.

---

## 📝 Notes

- CSV must have a header row with `utc_timestamp` and `<COUNTRY_CODE>_temperature` columns.
- Date filtering works on the first 10 characters of the timestamp (`YYYY-MM-DD`).
- Prediction uses a simple linear regression on the series of average values.
