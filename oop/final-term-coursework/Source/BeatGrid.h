/*
  ==============================================================================

    BeatGrid.h
    Created: 2024
    Author:  Alan Nascimento

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"

//==============================================================================
/*
    BeatGrid component that provides BPM detection and beat grid visualization
    Inspired by professional DJ software like Serato and Traktor
*/
class BeatGrid : public Component,
                 public Button::Listener,
                 public Slider::Listener,
                 public Timer
{
public:
    BeatGrid();
    ~BeatGrid();

    void paint(Graphics& g) override;
    void resized() override;

    // Button::Listener implementation
    void buttonClicked(Button* button) override;

    // Slider::Listener implementation
    void sliderValueChanged(Slider* slider) override;

    // Timer implementation
    void timerCallback() override;

    // Beat grid functions
    void setBPM(double bpm);
    void setCurrentPosition(double position);
    void setTrackLength(double length);
    void detectBPM(const AudioBuffer<float>& buffer, double sampleRate);
    void snapToGrid(double& position);
    void setGridEnabled(bool enabled) { gridEnabled = enabled; repaint(); }

    // Public accessors
    double getBPM() const { return currentBPM; }
    bool isGridEnabled() const { return gridEnabled; }
    double getBeatInterval() const { return 60.0 / currentBPM; }

    // Signal for BPM changes
    std::function<void(double)> onBPMChanged;

private:
    // UI Components
    TextButton detectButton{"DETECT BPM"};
    TextButton tapButton{"TAP BPM"};
    TextButton gridToggleButton{"GRID ON"};

    Slider bpmSlider;
    Slider sensitivitySlider;

    Label bpmLabel;
    Label beatLabel;
    Label statusLabel;

    // Beat grid data
    double currentBPM = 128.0;
    double currentPosition = 0.0;
    double trackLength = 1.0;
    bool gridEnabled = true;

    // BPM detection
    std::vector<double> tapTimes;
    std::vector<float> energyBuffer;
    double lastTapTime = 0.0;
    int tapCount = 0;

    // Beat visualization
    double lastBeatTime = 0.0;
    bool beatFlash = false;

    // Colors
    Colour gridColor = Colour(0xFF3498DB);
    Colour beatColor = Colour(0xFFE74C3C);
    Colour accentColor = Colour(0xFFF39C12);

    // Helper functions
    void setupUI();
    void setupSliders();
    void setupButtons();
    void drawBeatGrid(Graphics& g, Rectangle<float> bounds);
    void drawBPMIndicator(Graphics& g, Rectangle<float> bounds);
    void drawBeatMarker(Graphics& g, Rectangle<float> bounds);
    void calculateBPMFromTaps();
    double calculateEnergy(const AudioBuffer<float>& buffer);
    void updateBeatFlash();

    // Custom paint functions
    void paintBackground(Graphics& g);
    void paintGrid(Graphics& g, Rectangle<float> bounds);
    void paintControls(Graphics& g);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(BeatGrid)
};
