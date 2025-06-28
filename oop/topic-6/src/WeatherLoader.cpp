#include "WeatherLoader.h"                    // Include loader header
#include <fstream>                                // For file I/O
#include <sstream>                                // For string stream
#include <stdexcept>                              // For exceptions

std::vector<WeatherRecord> WeatherLoader::loadCSV(
    const std::string& filename,
    const std::string& country) {
    std::ifstream infile(filename);           // Open file
    if (!infile) throw std::runtime_error("Cannot open " + filename); // Error if fail

    std::string header;                       // To read header line
    std::getline(infile, header);            // Read header
    std::stringstream hs(header);            // Stream for splitting
    std::vector<std::string> cols;           // Vector for column names
    std::string col;
    while (std::getline(hs, col, ','))       // Split by comma
        cols.push_back(col);                 // Store each header

    int idxTs = -1, idxTemp = -1;            // Indices for timestamp & temp
    for (int i = 0; i < (int)cols.size(); ++i) {
        if (cols[i] == "utc_timestamp") idxTs = i;       // Find timestamp col
        if (cols[i] == country + "_temperature") idxTemp = i; // Find temp col
    }
    // Validate indices
    if (idxTs < 0 || idxTemp < 0)
        throw std::runtime_error("Missing header fields");

    std::vector<WeatherRecord> data;         // Output vector
    std::string line;
    while (std::getline(infile, line)) {    // Read each data line
        std::stringstream ss(line);          // Split line
        std::vector<std::string> row;
        std::string cell;
        while (std::getline(ss, cell, ',')) // Split by comma
            row.push_back(cell);            // Store cell
        if ((int)row.size() <= idxTemp) continue; // Skip invalid rows
        try {
            double temp = std::stod(row[idxTemp]);   // Convert to double
            data.push_back({row[idxTs], country, temp}); // Add record
        } catch (...) {
            // Skip parse errors
        }
    }
    return data;                              // Return records
}
