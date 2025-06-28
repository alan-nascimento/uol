#include <iostream>                             // For std::cout, std::cerr
#include <string>                               // For std::string
#include <vector>                               // For std::vector
#include "WeatherLoader.h"                    // CSV loader
#include "DataFilter.h"                       // Filters
#include "CandlestickBuilder.h"               // Builder
#include "ASCIIPlotter.h"                     // Plotter
#include "Predictor.h"                        // Predictor

int main(int argc, char* argv[]) {
    // Check for required arguments
    if (argc < 3) {
        std::cerr << "Usage: " << argv[0]
                  << " <csv-file> <COUNTRY_CODE> [--from YYYY-MM-DD]"
                     " [--to YYYY-MM-DD] [--minT X] [--maxT Y]"
                     " [--period year|month|day] [--plot] [--predict]\n";
        return 1;                              // Exit if missing
    }

    std::string file    = argv[1];            // CSV file path
    std::string country = argv[2];            // Country code to load
    std::string from    = "0000-00-00";      // Date filter start
    std::string to      = "9999-12-31";      // Date filter end
    double minT         = -1e9;               // Min temperature filter
    double maxT         = 1e9;                // Max temperature filter
    Period period       = Period::MONTH;      // Default period grouping
    bool doPlot         = false;              // Plot flag
    bool doPredict      = false;              // Predict flag

    // Parse optional flags
    for (int i = 3; i < argc; ++i) {
        std::string a = argv[i];
        if (a == "--from" && i + 1 < argc) from = argv[++i];
        else if (a == "--to"   && i + 1 < argc) to   = argv[++i];
        else if (a == "--minT" && i + 1 < argc) minT = std::stod(argv[++i]);
        else if (a == "--maxT" && i + 1 < argc) maxT = std::stod(argv[++i]);
        else if (a == "--period" && i + 1 < argc) {
            std::string p = argv[++i];
            if      (p == "year")  period = Period::YEAR;
            else if (p == "month") period = Period::MONTH;
            else if (p == "day")   period = Period::DAY;
        } else if (a == "--plot")    doPlot    = true; // Enable plot
        else if (a == "--predict") doPredict = true; // Enable prediction
    }

    // Load data for specified country
    auto data = WeatherLoader::loadCSV(file, country);
    // Apply date and temperature filters
    data = DataFilter::byDateRange(data, from, to);
    data = DataFilter::byTempRange(data, minT, maxT);
    // Build candlestick data
    auto candles = CandlestickBuilder::build(data, period);

    if (doPlot)    ASCIIPlotter::plot(candles);  // Plot ASCII chart
    if (doPredict) {                            // Perform prediction
        std::vector<double> avgs;
        for (auto& c : candles)                  // Compute average per candle
            avgs.push_back((c.open + c.close + c.high + c.low) / 4.0);
        std::cout << "Predicted next average: "
                  << Predictor::predictNextAverage(avgs)
                  << '\n';                  // Output prediction
    }
    return 0;                                  // Successful exit
}
