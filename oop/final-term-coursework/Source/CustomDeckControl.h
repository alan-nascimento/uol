/*
  ==============================================================================

    CustomDeckControl.h
    Created: 2024
    Author:  Alan Nascimento

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"
#include "DJAudioPlayer.h"
#include "WaveformDisplay.h"

//==============================================================================
/*
    Custom deck control component with unique graphics and controls
    inspired by professional DJ equipment
*/
class CustomDeckControl : public Component,
                         public Button::Listener,
                         public Slider::Listener,
                         public FileDragAndDropTarget,
                         public Timer
{
public:
    CustomDeckControl(DJAudioPlayer* player,
                     AudioFormatManager& formatManagerToUse,
                     AudioThumbnailCache& cacheToUse,
                     int deckNumber);
    ~CustomDeckControl();

    void paint(Graphics& g) override;
    void resized() override;

    // Button::Listener implementation
    void buttonClicked(Button* button) override;

    // Slider::Listener implementation
    void sliderValueChanged(Slider* slider) override;

    // FileDragAndDropTarget implementation
    bool isInterestedInFileDrag(const StringArray& files) override;
    void filesDropped(const StringArray& files, int x, int y) override;

    // Timer implementation
    void timerCallback() override;

    // Public methods
    void loadFile(const File& file);
    void setDeckNumber(int number) { deckNumber = number; repaint(); }

private:
    // UI Components
    TextButton playButton{"PLAY"};
    TextButton stopButton{"STOP"};
    TextButton cueButton{"CUE"};
    TextButton syncButton{"SYNC"};
    TextButton loadButton{"LOAD"};

    Slider volumeSlider;
    Slider speedSlider;
    Slider positionSlider;
    Slider eqLowSlider;
    Slider eqMidSlider;
    Slider eqHighSlider;

    Label deckLabel;
    Label trackInfoLabel;
    Label timeLabel;

    WaveformDisplay waveformDisplay;

    // Custom graphics elements
    Path vinylDisc;
    Path playhead;
    float rotationAngle = 0.0f;
    float vinylSpeed = 0.0f;

    // Rotating elements around the disc
    std::vector<Rectangle<float>> rotatingElements;
    float elementRotationAngle = 0.0f;
    float elementRotationSpeed = 0.02f;

    // Data
    DJAudioPlayer* player;
    int deckNumber;
    bool isPlaying = false;
    bool isCued = false;
    double cuePosition = 0.0;

    // Colors
    Colour deckColor;
    Colour accentColor;

    // Helper functions
    void setupUI();
    void setupSliders();
    void setupButtons();
    void updateVinylRotation();
    void initializeRotatingElements();
    void drawVinylDisc(Graphics& g, Rectangle<float> bounds);
    void drawRotatingElements(Graphics& g, Rectangle<float> bounds);
    void drawEQVisualizer(Graphics& g, Rectangle<float> bounds);
    void drawVUMeter(Graphics& g, Rectangle<float> bounds);
    void updateTrackInfo();
    void updateTimeDisplay();

    // Custom paint functions
    void paintBackground(Graphics& g);
    void paintDeckFrame(Graphics& g);
    void paintControls(Graphics& g);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(CustomDeckControl)
};
