#include "Predictor.h"
#include <numeric>                              // For std::accumulate

double Predictor::predictNextAverage(const std::vector<double>& h) {
    int n = static_cast<int>(h.size());      // Number of points
    if (n == 0) return 0;                    // No data
    if (n == 1) return h[0];                 // Single point

    double xbar = (n - 1) / 2.0;             // Mean of x indices
    double ybar = std::accumulate(h.begin(), h.end(), 0.0) / n; // Mean of y

    double num = 0, den = 0;
    for (int i = 0; i < n; ++i) {
        num += (i - xbar) * (h[i] - ybar);   // Covariance numerator
        den += (i - xbar) * (i - xbar);       // Variance denominator
    }
    double slope     = (den != 0) ? (num / den) : 0; // Regression slope
    double intercept = ybar - slope * xbar;          // Regression intercept
    return intercept + slope * n;            // Predict next y
}
