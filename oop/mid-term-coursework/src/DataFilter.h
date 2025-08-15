#ifndef DATAFILTER_H
#define DATAFILTER_H
#include <vector>
#include "WeatherLoader.h"                    // For WeatherRecord

class DataFilter {
public:
    // Filter records by inclusive date range
    static std::vector<WeatherRecord> byDateRange(
        const std::vector<WeatherRecord>& data, // Input data
        const std::string& start,              // Start date YYYY-MM-DD
        const std::string& end);               // End date YYYY-MM-DD

    // Filter records by inclusive temperature range
    static std::vector<WeatherRecord> byTempRange(
        const std::vector<WeatherRecord>& data, // Input data
        double minT,                            // Minimum temp
        double maxT);                           // Maximum temp
};
#endif // DATAFILTER_H
