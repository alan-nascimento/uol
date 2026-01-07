/*
  ==============================================================================

    BeatGrid.cpp
    Created: 2024
    Author:  Alan Nascimento

  ==============================================================================
*/

#include "../JuceLibraryCode/JuceHeader.h"
#include "BeatGrid.h"

//==============================================================================
BeatGrid::BeatGrid()
{
    setupUI();
    setupSliders();
    setupButtons();

    startTimer(50); // 20 FPS for beat visualization
}

BeatGrid::~BeatGrid()
{
    stopTimer();
}

void BeatGrid::setupUI()
{
    addAndMakeVisible(detectButton);
    addAndMakeVisible(tapButton);
    addAndMakeVisible(gridToggleButton);

    addAndMakeVisible(bpmSlider);
    addAndMakeVisible(sensitivitySlider);

    addAndMakeVisible(bpmLabel);
    addAndMakeVisible(beatLabel);
    addAndMakeVisible(statusLabel);

    // Add listeners
    detectButton.addListener(this);
    tapButton.addListener(this);
    gridToggleButton.addListener(this);

    bpmSlider.addListener(this);
    sensitivitySlider.addListener(this);

    // Setup labels
    bpmLabel.setText("BPM: 128", dontSendNotification);
    bpmLabel.setJustificationType(Justification::centred);
    bpmLabel.setFont(Font(14.0f, Font::bold));
    bpmLabel.setColour(Label::textColourId, Colours::white);

    beatLabel.setText("Beat: 1", dontSendNotification);
    beatLabel.setJustificationType(Justification::centred);
    beatLabel.setFont(Font(12.0f));
    beatLabel.setColour(Label::textColourId, Colours::lightgrey);

    statusLabel.setText("Grid Active", dontSendNotification);
    statusLabel.setJustificationType(Justification::centred);
    statusLabel.setFont(Font(10.0f));
    statusLabel.setColour(Label::textColourId, Colour(0xFF27AE60));
}

void BeatGrid::setupSliders()
{
    // BPM slider
    bpmSlider.setSliderStyle(Slider::RotaryHorizontalVerticalDrag);
    bpmSlider.setRange(60.0, 200.0, 0.1);
    bpmSlider.setValue(128.0);
    bpmSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 60, 20);
    bpmSlider.setColour(Slider::thumbColourId, gridColor);
    bpmSlider.setColour(Slider::trackColourId, accentColor);

    // Sensitivity slider
    sensitivitySlider.setSliderStyle(Slider::LinearVertical);
    sensitivitySlider.setRange(0.1, 2.0, 0.1);
    sensitivitySlider.setValue(1.0);
    sensitivitySlider.setTextBoxStyle(Slider::TextBoxBelow, false, 50, 15);
    sensitivitySlider.setColour(Slider::thumbColourId, beatColor);
    sensitivitySlider.setColour(Slider::trackColourId, accentColor);
}

void BeatGrid::setupButtons()
{
    // Style buttons
    detectButton.setColour(TextButton::buttonColourId, gridColor);
    detectButton.setColour(TextButton::buttonOnColourId, accentColor);
    detectButton.setColour(TextButton::textColourOffId, Colours::white);
    detectButton.setColour(TextButton::textColourOnId, Colours::white);

    tapButton.setColour(TextButton::buttonColourId, beatColor);
    tapButton.setColour(TextButton::buttonOnColourId, Colour(0xFFC0392B));
    tapButton.setColour(TextButton::textColourOffId, Colours::white);
    tapButton.setColour(TextButton::textColourOnId, Colours::white);

    gridToggleButton.setColour(TextButton::buttonColourId, Colour(0xFF27AE60));
    gridToggleButton.setColour(TextButton::buttonOnColourId, Colour(0xFF229954));
    gridToggleButton.setColour(TextButton::textColourOffId, Colours::white);
    gridToggleButton.setColour(TextButton::textColourOnId, Colours::white);
}

void BeatGrid::paint(Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();
    paintBackground(g);
    paintGrid(g, bounds);
    paintControls(g);
}

void BeatGrid::paintBackground(Graphics& g)
{
    // Dark gradient background
    g.setGradientFill(ColourGradient(
        Colour(0xFF1A1A1A), 0.0f, 0.0f,
        Colour(0xFF2C2C2C), getWidth(), getHeight(), false));
    g.fillAll();
}

void BeatGrid::paintGrid(Graphics& g, Rectangle<float> bounds)
{
    if (!gridEnabled) return;

    // Draw grid lines
    double beatInterval = getBeatInterval();
    double gridSpacing = bounds.getWidth() / (trackLength / beatInterval);

    g.setColour(gridColor.withAlpha(0.3f));

    // Draw major beats (every 4 beats)
    for (int i = 0; i <= trackLength / beatInterval; ++i)
    {
        float x = bounds.getX() + (i * gridSpacing);
        if (x <= bounds.getRight())
        {
            if (i % 4 == 0)
            {
                g.setColour(gridColor.withAlpha(0.6f));
                g.drawVerticalLine(x, bounds.getY(), bounds.getBottom());
            }
            else
            {
                g.setColour(gridColor.withAlpha(0.2f));
                g.drawVerticalLine(x, bounds.getY(), bounds.getBottom());
            }
        }
    }

    // Draw horizontal lines
    g.setColour(gridColor.withAlpha(0.1f));
    for (int i = 1; i < 4; ++i)
    {
        float y = bounds.getY() + (bounds.getHeight() * i / 4);
        g.drawHorizontalLine(y, bounds.getX(), bounds.getRight());
    }
}

void BeatGrid::drawBPMIndicator(Graphics& g, Rectangle<float> bounds)
{
    // Draw BPM indicator circle
    auto centerX = bounds.getCentreX();
    auto centerY = bounds.getCentreY();
    auto radius = 30.0f;

    // Outer circle
    g.setColour(gridColor.withAlpha(0.3f));
    g.fillEllipse(centerX - radius, centerY - radius, radius * 2, radius * 2);

    // Inner circle
    g.setColour(gridColor);
    g.fillEllipse(centerX - radius * 0.7f, centerY - radius * 0.7f, radius * 1.4f, radius * 1.4f);

    // BPM text
    g.setColour(Colours::white);
    g.setFont(Font(12.0f, Font::bold));
    g.drawText(String((int)currentBPM),
               centerX - radius * 0.5f, centerY - radius * 0.5f,
               radius, radius, Justification::centred);
}

void BeatGrid::drawBeatMarker(Graphics& g, Rectangle<float> bounds)
{
    // Draw current position marker
    float markerX = bounds.getX() + (currentPosition * bounds.getWidth());

    if (beatFlash)
    {
        g.setColour(beatColor.withAlpha(0.8f));
        g.fillEllipse(markerX - 5, bounds.getY() - 5, 10, 10);
    }

    g.setColour(beatColor);
    g.drawVerticalLine(markerX, bounds.getY(), bounds.getBottom());
    g.fillEllipse(markerX - 3, bounds.getY() - 3, 6, 6);
}

void BeatGrid::resized()
{
    auto bounds = getLocalBounds().reduced(8);

    // Top controls area - increased height
    auto topArea = bounds.removeFromTop(100);

    // BPM slider (left)
    auto bpmArea = topArea.removeFromLeft(90);
    bpmSlider.setBounds(bpmArea.reduced(8));

    // Buttons (center) with better spacing
    auto buttonArea = topArea.removeFromLeft(180);
    int buttonWidth = (buttonArea.getWidth() - 10) / 3; // Leave space between buttons

    detectButton.setBounds(buttonArea.removeFromLeft(buttonWidth).reduced(3));
    buttonArea.removeFromLeft(5); // Spacing
    tapButton.setBounds(buttonArea.removeFromLeft(buttonWidth).reduced(3));
    buttonArea.removeFromLeft(5); // Spacing
    gridToggleButton.setBounds(buttonArea.reduced(3));

    // Sensitivity slider (right)
    auto sensitivityArea = topArea.removeFromRight(50);
    sensitivitySlider.setBounds(sensitivityArea.reduced(5));

    // Labels at bottom with more space
    auto labelArea = bounds.removeFromBottom(70);
    bpmLabel.setBounds(labelArea.removeFromTop(22).reduced(5));
    beatLabel.setBounds(labelArea.removeFromTop(22).reduced(5));
    statusLabel.setBounds(labelArea.reduced(5));
}

void BeatGrid::buttonClicked(Button* button)
{
    if (button == &detectButton)
    {
        // Simulate BPM detection
        double detectedBPM = 120.0 + (rand() % 40); // Random BPM between 120-160
        setBPM(detectedBPM);
        statusLabel.setText("BPM Detected: " + String((int)detectedBPM), dontSendNotification);
        statusLabel.setColour(Label::textColourId, Colour(0xFF27AE60));
    }
    else if (button == &tapButton)
    {
        // Tap tempo functionality
        double currentTime = Time::getMillisecondCounterHiRes() / 1000.0;

        if (currentTime - lastTapTime > 0.5) // Reset if too much time has passed
        {
            tapTimes.clear();
            tapCount = 0;
        }

        tapTimes.push_back(currentTime);
        tapCount++;
        lastTapTime = currentTime;

        if (tapCount >= 4)
        {
            calculateBPMFromTaps();
        }

        statusLabel.setText("Tap " + String(tapCount) + "/4", dontSendNotification);
        statusLabel.setColour(Label::textColourId, accentColor);
    }
    else if (button == &gridToggleButton)
    {
        gridEnabled = !gridEnabled;
        if (gridEnabled)
        {
            gridToggleButton.setButtonText("GRID ON");
            statusLabel.setText("Grid Active", dontSendNotification);
            statusLabel.setColour(Label::textColourId, Colour(0xFF27AE60));
        }
        else
        {
            gridToggleButton.setButtonText("GRID OFF");
            statusLabel.setText("Grid Disabled", dontSendNotification);
            statusLabel.setColour(Label::textColourId, Colour(0xFFE74C3C));
        }
        repaint();
    }
}

void BeatGrid::sliderValueChanged(Slider* slider)
{
    if (slider == &bpmSlider)
    {
        setBPM(slider->getValue());
    }
}

void BeatGrid::timerCallback()
{
    updateBeatFlash();
    repaint();
}

void BeatGrid::setBPM(double bpm)
{
    currentBPM = bpm;
    bpmSlider.setValue(bpm, dontSendNotification);
    bpmLabel.setText("BPM: " + String((int)bpm), dontSendNotification);

    if (onBPMChanged)
        onBPMChanged(bpm);
}

void BeatGrid::setCurrentPosition(double position)
{
    currentPosition = position;

    // Update beat label
    double beatInterval = getBeatInterval();
    int currentBeat = (int)(position / beatInterval) + 1;
    beatLabel.setText("Beat: " + String(currentBeat), dontSendNotification);
}

void BeatGrid::setTrackLength(double length)
{
    trackLength = length;
}

void BeatGrid::detectBPM(const AudioBuffer<float>& buffer, double sampleRate)
{
    // Simple energy-based BPM detection
    double energy = calculateEnergy(buffer);
    energyBuffer.push_back(energy);

    // Keep only last 1000 samples
    if (energyBuffer.size() > 1000)
        energyBuffer.erase(energyBuffer.begin());

    // Simple peak detection
    if (energyBuffer.size() > 10)
    {
        float threshold = sensitivitySlider.getValue() * 0.5f;
        if (energy > threshold && energy > energyBuffer[energyBuffer.size() - 2])
        {
            // Potential beat detected
            double currentTime = Time::getMillisecondCounterHiRes() / 1000.0;
            if (currentTime - lastBeatTime > 0.3) // Minimum interval
            {
                lastBeatTime = currentTime;
                beatFlash = true;
            }
        }
    }
}

void BeatGrid::snapToGrid(double& position)
{
    if (!gridEnabled) return;

    double beatInterval = getBeatInterval();
    double beatPosition = position / beatInterval;
    double snappedBeat = round(beatPosition);
    position = snappedBeat * beatInterval;
}

double BeatGrid::calculateEnergy(const AudioBuffer<float>& buffer)
{
    double energy = 0.0;
    int numSamples = buffer.getNumSamples();

    for (int channel = 0; channel < buffer.getNumChannels(); ++channel)
    {
        const float* channelData = buffer.getReadPointer(channel);
        for (int sample = 0; sample < numSamples; ++sample)
        {
            energy += channelData[sample] * channelData[sample];
        }
    }

    return energy / (numSamples * buffer.getNumChannels());
}

void BeatGrid::calculateBPMFromTaps()
{
    if (tapTimes.size() < 4) return;

    std::vector<double> intervals;
    for (size_t i = 1; i < tapTimes.size(); ++i)
    {
        intervals.push_back(tapTimes[i] - tapTimes[i-1]);
    }

    // Calculate average interval
    double avgInterval = 0.0;
    for (double interval : intervals)
    {
        avgInterval += interval;
    }
    avgInterval /= intervals.size();

    // Convert to BPM
    double detectedBPM = 60.0 / avgInterval;

    // Clamp to reasonable range
    detectedBPM = jlimit(60.0, 200.0, detectedBPM);

    setBPM(detectedBPM);
    statusLabel.setText("BPM: " + String((int)detectedBPM) + " (Tapped)", dontSendNotification);
    statusLabel.setColour(Label::textColourId, Colour(0xFF27AE60));
}

void BeatGrid::updateBeatFlash()
{
    if (beatFlash)
    {
        beatFlash = false;
    }
}

void BeatGrid::paintControls(Graphics& g)
{
    // This method is called from paint() but the controls are handled by resized()
    // The actual UI controls are positioned in resized() method
    // This method can be used for any additional custom painting of controls if needed
}
