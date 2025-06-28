#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include "StockEntry.h"

std::vector<std::string> tokenise(const std::string& line, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::stringstream ss(line);
    while (getline(ss, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

int main() {
    std::ifstream file("google_5yr_one.csv");
    if (!file.is_open()) {
        std::cerr << "Failed to open file." << std::endl;
        return 1;
    }

    std::string line;
    std::vector<StockEntry> entries;
    int lineNumber = 0;

    // Skip the first two lines (header + GOOGL line)
    std::getline(file, line);
    std::getline(file, line);

    while (std::getline(file, line)) {
        lineNumber++;
        std::vector<std::string> tokens = tokenise(line, ',');
        if (tokens.size() != 6) {
            std::cerr << "Invalid line " << lineNumber << ": " << line << std::endl;
            continue;
        }

        try {
            std::string date = tokens[0];
            double close = std::stod(tokens[1]);
            double high = std::stod(tokens[2]);
            double low = std::stod(tokens[3]);
            double open = std::stod(tokens[4]);
            unsigned long volume = std::stoul(tokens[5]);

            entries.emplace_back(date, close, high, low, open, volume);
        } catch (const std::exception& e) {
            std::cerr << "Error parsing line " << lineNumber << ": " << e.what() << std::endl;
            continue;
        }
    }

    file.close();

    std::cout << "Parsed " << entries.size() << " valid entries." << std::endl;
    for (const auto& entry : entries) {
        std::cout << entry.date << " | Close: " << entry.close
                  << " | High: " << entry.high
                  << " | Low: " << entry.low
                  << " | Open: " << entry.open
                  << " | Volume: " << entry.volume << std::endl;
    }

    return 0;
}
