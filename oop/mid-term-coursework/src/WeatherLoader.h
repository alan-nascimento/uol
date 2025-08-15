#ifndef WEATHERLOADER_H
#define WEATHERLOADER_H
#include <string>                                   // For std::string
#include <vector>                                   // For std::vector

// Struct to hold single weather data record
struct WeatherRecord {
    std::string timestamp;                     // UTC timestamp string
    std::string country;                       // Country code
    double temperature;                        // Temperature value
};

class WeatherLoader {
public:
    // Load CSV file and extract only the specified country column
    static std::vector<WeatherRecord> loadCSV(
        const std::string& filename,           // Path to CSV file
        const std::string& country);           // Country code for column
};
#endif // WEATHERLOADER_H
