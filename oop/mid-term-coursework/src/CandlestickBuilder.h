#ifndef CANDLESTICKBUILDER_H
#define CANDLESTICKBUILDER_H
#include <vector>
#include "WeatherLoader.h"                    // For WeatherRecord
#include "Candlestick.h"

enum class Period { YEAR, MONTH, DAY };       // Aggregation levels

class CandlestickBuilder {
public:
    // Build candlesticks grouped by period
    static std::vector<Candlestick> build(
        const std::vector<WeatherRecord>& data, // Input data
        Period period);                        // Grouping period
};
#endif // CANDLESTICKBUILDER_H
