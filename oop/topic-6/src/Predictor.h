#ifndef PREDICTOR_H
#define PREDICTOR_H
#include <vector>

class Predictor {
public:
    // Predict next average using linear regression
    static double predictNextAverage(const std::vector<double>& historical);
};
#endif // PREDICTOR_H
