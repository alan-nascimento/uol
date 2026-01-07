/*
  ==============================================================================

    CustomDeckControl.cpp
    Created: 2024
    Author:  Alan Nascimento

  ==============================================================================
*/

#include "../JuceLibraryCode/JuceHeader.h"
#include "CustomDeckControl.h"

//==============================================================================
CustomDeckControl::CustomDeckControl(DJAudioPlayer* _player,
                                   AudioFormatManager& formatManagerToUse,
                                   AudioThumbnailCache& cacheToUse,
                                   int _deckNumber)
    : player(_player), deckNumber(_deckNumber), waveformDisplay(formatManagerToUse, cacheToUse)
{
    // Set deck colors based on deck number - different shades of gray
    if (deckNumber == 1)
    {
        deckColor = Colour(0xFF4A4A4A);  // Dark gray
        accentColor = Colour(0xFF2C2C2C);
    }
    else
    {
        deckColor = Colour(0xFF6B6B6B);  // Medium gray
        accentColor = Colour(0xFF4A4A4A);
    }

    setupUI();
    setupSliders();
    setupButtons();

    // Create vinyl disc path
    vinylDisc.addEllipse(0, 0, 100, 100);

    // Initialize rotating elements around the disc
    initializeRotatingElements();

    // Initialize rotation angles to 0
    rotationAngle = 0.0f;
    elementRotationAngle = 0.0f;
    vinylSpeed = 0.0f;

    startTimer(30); // 33 FPS for smoother animations and waveform updates
}

CustomDeckControl::~CustomDeckControl()
{
    stopTimer();
}

void CustomDeckControl::setupUI()
{
    addAndMakeVisible(playButton);
    addAndMakeVisible(stopButton);
    addAndMakeVisible(cueButton);
    addAndMakeVisible(syncButton);
    addAndMakeVisible(loadButton);

    addAndMakeVisible(volumeSlider);
    addAndMakeVisible(speedSlider);
    addAndMakeVisible(positionSlider);
    addAndMakeVisible(eqLowSlider);
    addAndMakeVisible(eqMidSlider);
    addAndMakeVisible(eqHighSlider);

    addAndMakeVisible(deckLabel);
    addAndMakeVisible(trackInfoLabel);
    addAndMakeVisible(timeLabel);
    addAndMakeVisible(waveformDisplay);

    // Add listeners
    playButton.addListener(this);
    stopButton.addListener(this);
    cueButton.addListener(this);
    syncButton.addListener(this);
    loadButton.addListener(this);

    volumeSlider.addListener(this);
    speedSlider.addListener(this);
    positionSlider.addListener(this);
    eqLowSlider.addListener(this);
    eqMidSlider.addListener(this);
    eqHighSlider.addListener(this);

    // Setup labels
    deckLabel.setText("DECK " + String(deckNumber), dontSendNotification);
    deckLabel.setJustificationType(Justification::centred);
    deckLabel.setFont(Font(16.0f, Font::bold));
    deckLabel.setColour(Label::textColourId, Colours::white);

    trackInfoLabel.setText("No Track Loaded", dontSendNotification);
    trackInfoLabel.setJustificationType(Justification::centred);
    trackInfoLabel.setFont(Font(12.0f));
    trackInfoLabel.setColour(Label::textColourId, Colours::lightgrey);

    timeLabel.setText("00:00 / 00:00", dontSendNotification);
    timeLabel.setJustificationType(Justification::centred);
    timeLabel.setFont(Font(12.0f));
    timeLabel.setColour(Label::textColourId, Colours::lightgrey);
}

void CustomDeckControl::setupSliders()
{
    // Volume slider (vertical)
    volumeSlider.setSliderStyle(Slider::LinearVertical);
    volumeSlider.setRange(0.0, 1.0, 0.01);
    volumeSlider.setValue(0.5);
    volumeSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 60, 20);
    volumeSlider.setColour(Slider::thumbColourId, deckColor);
    volumeSlider.setColour(Slider::trackColourId, accentColor);

    // Speed slider (rotary)
    speedSlider.setSliderStyle(Slider::RotaryHorizontalVerticalDrag);
    speedSlider.setRange(0.25, 4.0, 0.01);
    speedSlider.setValue(1.0);
    speedSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 60, 20);
    speedSlider.setColour(Slider::thumbColourId, deckColor);
    speedSlider.setColour(Slider::trackColourId, accentColor);

    // Position slider (horizontal)
    positionSlider.setSliderStyle(Slider::LinearHorizontal);
    positionSlider.setRange(0.0, 1.0, 0.001);
    positionSlider.setValue(0.0);
    positionSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 60, 20);
    positionSlider.setColour(Slider::thumbColourId, deckColor);
    positionSlider.setColour(Slider::trackColourId, accentColor);

    // EQ sliders (vertical)
    eqLowSlider.setSliderStyle(Slider::LinearVertical);
    eqLowSlider.setRange(-12.0, 12.0, 0.1);
    eqLowSlider.setValue(0.0);
    eqLowSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 40, 15);
    eqLowSlider.setColour(Slider::thumbColourId, Colour(0xFFE67E22)); // Orange

    eqMidSlider.setSliderStyle(Slider::LinearVertical);
    eqMidSlider.setRange(-12.0, 12.0, 0.1);
    eqMidSlider.setValue(0.0);
    eqMidSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 40, 15);
    eqMidSlider.setColour(Slider::thumbColourId, Colour(0xFFF1C40F)); // Yellow

    eqHighSlider.setSliderStyle(Slider::LinearVertical);
    eqHighSlider.setRange(-12.0, 12.0, 0.1);
    eqHighSlider.setValue(0.0);
    eqHighSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 40, 15);
    eqHighSlider.setColour(Slider::thumbColourId, Colour(0xFF9B59B6)); // Purple
}

void CustomDeckControl::setupButtons()
{
    // Style buttons
    playButton.setColour(TextButton::buttonColourId, deckColor);
    playButton.setColour(TextButton::buttonOnColourId, accentColor);
    playButton.setColour(TextButton::textColourOffId, Colours::white);
    playButton.setColour(TextButton::textColourOnId, Colours::white);

    stopButton.setColour(TextButton::buttonColourId, Colour(0xFF95A5A6));
    stopButton.setColour(TextButton::textColourOffId, Colours::white);

    cueButton.setColour(TextButton::buttonColourId, Colour(0xFFF39C12));
    cueButton.setColour(TextButton::buttonOnColourId, Colour(0xFFE67E22));
    cueButton.setColour(TextButton::textColourOffId, Colours::white);
    cueButton.setColour(TextButton::textColourOnId, Colours::white);

    syncButton.setColour(TextButton::buttonColourId, Colour(0xFF27AE60));
    syncButton.setColour(TextButton::buttonOnColourId, Colour(0xFF229954));
    syncButton.setColour(TextButton::textColourOffId, Colours::white);
    syncButton.setColour(TextButton::textColourOnId, Colours::white);

    loadButton.setColour(TextButton::buttonColourId, Colour(0xFF9B59B6));
    loadButton.setColour(TextButton::textColourOffId, Colours::white);
}

void CustomDeckControl::paint(Graphics& g)
{
    paintBackground(g);
    paintDeckFrame(g);
    paintControls(g);
}

void CustomDeckControl::paintBackground(Graphics& g)
{
    // Dark gradient background
    g.setGradientFill(ColourGradient(
        Colour(0xFF1A1A1A), 0.0f, 0.0f,
        Colour(0xFF2C2C2C), getWidth(), getHeight(), false));
    g.fillAll();
}

void CustomDeckControl::paintDeckFrame(Graphics& g)
{
    auto bounds = getLocalBounds().toFloat().reduced(5);

    // Main deck frame
    g.setColour(deckColor);
    g.fillRoundedRectangle(bounds, 10.0f);

    // Inner frame
    g.setColour(accentColor);
    g.drawRoundedRectangle(bounds, 10.0f, 3.0f);

    // Note: Deck number is now handled by the deckLabel component
    // No need to draw it here to avoid duplication
}

void CustomDeckControl::paintControls(Graphics& g)
{
    auto bounds = getLocalBounds().toFloat().reduced(15);
    bounds.removeFromTop(40); // Space for deck label

    // Draw vinyl disc area - only in the visual area (not under controls)
    auto vinylBounds = bounds.removeFromLeft(100);
    vinylBounds = vinylBounds.removeFromTop(100); // Smaller area for visual only
    drawVinylDisc(g, vinylBounds);

    // Draw VU meter
    auto vuBounds = bounds.removeFromRight(30);
    vuBounds = vuBounds.removeFromTop(100); // Smaller area for visual only
    drawVUMeter(g, vuBounds);

    // Draw EQ visualizer - only in the remaining area
    auto eqBounds = bounds.removeFromBottom(60);
    drawEQVisualizer(g, eqBounds);
}

void CustomDeckControl::drawVinylDisc(Graphics& g, Rectangle<float> bounds)
{
    // Center the vinyl
    auto centerX = bounds.getCentreX();
    auto centerY = bounds.getCentreY();
    auto radius = jmin(bounds.getWidth(), bounds.getHeight()) * 0.4f;

    // Apply rotation
    g.addTransform(AffineTransform::rotation(rotationAngle, centerX, centerY));

    // Draw vinyl disc
    g.setColour(Colour(0xFF2C3E50));
    g.fillEllipse(centerX - radius, centerY - radius, radius * 2, radius * 2);

    // Draw vinyl grooves
    g.setColour(Colour(0xFF34495E));
    for (int i = 1; i <= 5; ++i)
    {
        float grooveRadius = radius * (0.2f + i * 0.15f);
        g.drawEllipse(centerX - grooveRadius, centerY - grooveRadius,
                     grooveRadius * 2, grooveRadius * 2, 1.0f);
    }

    // Draw center label
    g.setColour(deckColor);
    g.fillEllipse(centerX - radius * 0.15f, centerY - radius * 0.15f,
                  radius * 0.3f, radius * 0.3f);

    // Draw center hole
    g.setColour(Colour(0xFF1A1A1A));
    g.fillEllipse(centerX - radius * 0.05f, centerY - radius * 0.05f,
                  radius * 0.1f, radius * 0.1f);

    // Note: In this version of JUCE, we don't need to restore the transform
    // as it's automatically handled by the Graphics context

    // Draw playhead if playing
    if (isPlaying)
    {
        g.setColour(Colour(0xFFE74C3C));
        g.drawLine(centerX, centerY - radius - 5, centerX, centerY - radius + 5, 3.0f);
    }

    // Draw rotating elements around the disc
    drawRotatingElements(g, bounds);
}

void CustomDeckControl::drawVUMeter(Graphics& g, Rectangle<float> bounds)
{
    // VU meter background
    g.setColour(Colour(0xFF2C3E50));
    g.fillRect(bounds);

    // VU meter levels (simulated)
    float level = isPlaying ? 0.7f : 0.0f;
    auto levelBounds = bounds.reduced(2);
    levelBounds.setHeight(levelBounds.getHeight() * level);

    if (level > 0.8f)
        g.setColour(Colour(0xFFE74C3C)); // Red
    else if (level > 0.6f)
        g.setColour(Colour(0xFFF39C12)); // Orange
    else
        g.setColour(Colour(0xFF27AE60)); // Green

    g.fillRect(levelBounds);

    // VU meter border
    g.setColour(Colours::white);
    g.drawRect(bounds, 1.0f);
}

void CustomDeckControl::drawEQVisualizer(Graphics& g, Rectangle<float> bounds)
{
    // EQ visualizer background
    g.setColour(Colour(0xFF2C3E50));
    g.fillRect(bounds);

    // Draw EQ bars
    float barWidth = bounds.getWidth() / 3;

    // Low frequencies
    float lowLevel = (eqLowSlider.getValue() + 12.0f) / 24.0f;
    auto lowBounds = bounds.removeFromLeft(barWidth).reduced(2);
    lowBounds.setHeight(lowBounds.getHeight() * lowLevel);
    g.setColour(Colour(0xFFE67E22));
    g.fillRect(lowBounds);

    // Mid frequencies
    float midLevel = (eqMidSlider.getValue() + 12.0f) / 24.0f;
    auto midBounds = bounds.removeFromLeft(barWidth).reduced(2);
    midBounds.setHeight(midBounds.getHeight() * midLevel);
    g.setColour(Colour(0xFFF1C40F));
    g.fillRect(midBounds);

    // High frequencies
    float highLevel = (eqHighSlider.getValue() + 12.0f) / 24.0f;
    auto highBounds = bounds.reduced(2);
    highBounds.setHeight(highBounds.getHeight() * highLevel);
    g.setColour(Colour(0xFF9B59B6));
    g.fillRect(highBounds);

    // EQ visualizer border
    g.setColour(Colours::white);
    g.drawRect(bounds, 1.0f);
}

void CustomDeckControl::resized()
{
    auto bounds = getLocalBounds().reduced(8);

    // Deck label at top with more space
    deckLabel.setBounds(bounds.removeFromTop(35));

    // Main control area - increased height
    auto controlArea = bounds.removeFromTop(180);

    // Vinyl area (left) - smaller to give more space
    auto vinylArea = controlArea.removeFromLeft(100);

    // VU meter (right) - smaller
    auto vuArea = controlArea.removeFromRight(30);

    // Buttons in center - better spacing (2x3 grid)
    auto buttonArea = controlArea.reduced(15);
    int buttonSize = 30;
    int buttonSpacing = 10;

    // Top row buttons
    playButton.setBounds(buttonArea.getCentreX() - buttonSize - buttonSpacing,
                        buttonArea.getCentreY() - buttonSize - buttonSpacing, buttonSize, buttonSize);
    stopButton.setBounds(buttonArea.getCentreX(),
                        buttonArea.getCentreY() - buttonSize - buttonSpacing, buttonSize, buttonSize);
    loadButton.setBounds(buttonArea.getCentreX() + buttonSize + buttonSpacing,
                        buttonArea.getCentreY() - buttonSize - buttonSpacing, buttonSize, buttonSize);

    // Bottom row buttons
    cueButton.setBounds(buttonArea.getCentreX() - buttonSize - buttonSpacing,
                       buttonArea.getCentreY() + buttonSpacing, buttonSize, buttonSize);
    syncButton.setBounds(buttonArea.getCentreX(),
                        buttonArea.getCentreY() + buttonSpacing, buttonSize, buttonSize);

    // Remaining controls with better organization
    auto remainingArea = bounds;

    // Top row: Volume, EQ, and Speed sliders
    auto topRow = remainingArea.removeFromTop(120);

    // Volume slider (left)
    volumeSlider.setBounds(topRow.removeFromLeft(35).reduced(3));

    // EQ sliders (center)
    auto eqArea = topRow.removeFromLeft(120);
    eqLowSlider.setBounds(eqArea.removeFromLeft(35).reduced(3));
    eqMidSlider.setBounds(eqArea.removeFromLeft(35).reduced(3));
    eqHighSlider.setBounds(eqArea.reduced(3));

    // Speed slider (right)
    speedSlider.setBounds(topRow.removeFromLeft(80).reduced(5));

    // Waveform display (full width)
    auto waveformArea = remainingArea.removeFromTop(70);
    waveformDisplay.setBounds(waveformArea.reduced(5));

    // Position slider
    positionSlider.setBounds(remainingArea.removeFromTop(25).reduced(5));

    // Track info and time labels with more space
    trackInfoLabel.setBounds(remainingArea.removeFromTop(25).reduced(5));
    timeLabel.setBounds(remainingArea.removeFromTop(25).reduced(5));
}

void CustomDeckControl::buttonClicked(Button* button)
{
    if (player == nullptr)
        return;

    if (button == &playButton)
    {
        if (isPlaying)
        {
            player->stop();
            isPlaying = false;
            playButton.setButtonText("PLAY");

            // Reset waveform position when pausing
            waveformDisplay.setPositionRelative(0.0);
            waveformDisplay.repaint();
        }
        else
        {
            player->start();
            isPlaying = true;
            playButton.setButtonText("PAUSE");

            // Reset rotation when starting playback
            if (rotationAngle == 0.0f)
            {
                rotationAngle = 0.0f;
                elementRotationAngle = 0.0f;
            }
        }
    }
    else if (button == &stopButton)
    {
        player->stop();
        isPlaying = false;
        playButton.setButtonText("PLAY");
        player->setPositionRelative(0.0);

        // Reset waveform position when stopping
        waveformDisplay.setPositionRelative(0.0);
        waveformDisplay.repaint();
    }
    else if (button == &cueButton)
    {
        if (!isCued)
        {
            cuePosition = player->getPositionRelative();
            isCued = true;
            cueButton.setToggleState(true, dontSendNotification);
        }
        else
        {
            player->setPositionRelative(cuePosition);
            isCued = false;
            cueButton.setToggleState(false, dontSendNotification);
        }
    }
    else if (button == &syncButton)
    {
        // Sync feature - set speed to 1.0
        speedSlider.setValue(1.0);
    }
    else if (button == &loadButton)
    {
        // File chooser for loading audio files
        auto fileChooserFlags = FileBrowserComponent::canSelectFiles;
        FileChooser chooser("Select audio file...", File::getSpecialLocation(File::userMusicDirectory));

        chooser.launchAsync(fileChooserFlags, [this](const FileChooser& chooser)
        {
            File chosenFile = chooser.getResult();
            if (chosenFile.existsAsFile())
            {
                loadFile(chosenFile);
            }
        });
    }
}

void CustomDeckControl::sliderValueChanged(Slider* slider)
{
    if (player == nullptr)
        return;

    if (slider == &volumeSlider)
    {
        player->setGain(slider->getValue());
    }
    else if (slider == &speedSlider)
    {
        player->setSpeed(slider->getValue());
        vinylSpeed = slider->getValue();
    }
    else if (slider == &positionSlider)
    {
        player->setPositionRelative(slider->getValue());
    }
    // EQ sliders would be implemented with audio processing
}

bool CustomDeckControl::isInterestedInFileDrag(const StringArray& files)
{
    return files.size() == 1;
}

void CustomDeckControl::filesDropped(const StringArray& files, int x, int y)
{
    if (files.size() == 1)
    {
        File file(files[0]);
        loadFile(file);
    }
}

void CustomDeckControl::timerCallback()
{
    if (player == nullptr)
        return;

    updateVinylRotation();
    updateTimeDisplay();
    updateTrackInfo();

    // Update position slider and waveform only if playing
    if (isPlaying)
    {
        double position = player->getPositionRelative();
        positionSlider.setValue(position, dontSendNotification);

        // Update waveform display with bounds checking
        if (position >= 0.0 && position <= 1.0)
        {
            waveformDisplay.setPositionRelative(position);
            waveformDisplay.repaint();
        }
    }
    else
    {
        // Reset waveform position when stopped
        waveformDisplay.setPositionRelative(0.0);
        waveformDisplay.repaint();
    }
}

void CustomDeckControl::updateVinylRotation()
{
    // Only rotate if there's a track loaded and it's playing
    if (isPlaying && player != nullptr && player->getPositionRelative() > 0.0)
    {
        vinylSpeed = 0.05f; // Faster rotation when playing
        rotationAngle += vinylSpeed;
        if (rotationAngle > 2.0f * MathConstants<float>::pi)
        {
            rotationAngle -= 2.0f * MathConstants<float>::pi;
        }

        // Update rotating elements - only when playing
        elementRotationAngle += elementRotationSpeed * 2.0f;
        if (elementRotationAngle > 2.0f * MathConstants<float>::pi)
        {
            elementRotationAngle -= 2.0f * MathConstants<float>::pi;
        }
    }
    else
    {
        // Stop rotation when not playing
        vinylSpeed = 0.0f;
    }

    repaint();
}

void CustomDeckControl::updateTimeDisplay()
{
    if (player != nullptr)
    {
        double currentPos = player->getPositionRelative();
        // Ensure currentPos is valid
        if (currentPos < 0.0) currentPos = 0.0;
        if (currentPos > 1.0) currentPos = 1.0;

        // Calculate minutes and seconds safely
        int totalSeconds = (int)(currentPos * 60.0);
        int minutes = totalSeconds / 60;
        int seconds = totalSeconds % 60;

        // Format time string safely
        String timeText = String::formatted("%02d:%02d / %02d:%02d", minutes, seconds, 0, 0);
        timeLabel.setText(timeText, dontSendNotification);
    }
}

void CustomDeckControl::updateTrackInfo()
{
    // This would be updated when a track is loaded
    // For now, just show deck status
    String info = isPlaying ? "Playing" : "Stopped";
    if (isCued) info += " (Cued)";
    trackInfoLabel.setText(info, dontSendNotification);
}

void CustomDeckControl::loadFile(const File& file)
{
    if (file.existsAsFile())
    {
        player->loadURL(URL{file});
        waveformDisplay.loadURL(URL{file});

        // Update track info
        String fileName = file.getFileNameWithoutExtension();
        if (fileName.isEmpty())
            fileName = "Unknown Track";
        if (fileName.length() > 30)
            fileName = fileName.substring(0, 27) + "...";
        trackInfoLabel.setText(fileName, dontSendNotification);

        // Reset rotation when new file is loaded
        rotationAngle = 0.0f;
        elementRotationAngle = 0.0f;
        isPlaying = false;
    }
}

void CustomDeckControl::initializeRotatingElements()
{
    rotatingElements.clear();

    // Create 8 rectangular elements around the disc
    for (int i = 0; i < 8; ++i)
    {
        float angle = (2.0f * MathConstants<float>::pi * i) / 8.0f;
        float radius = 70.0f; // Distance from center

        // Create small rectangles
        Rectangle<float> element(0, 0, 8, 4);
        element.setCentre(radius * cos(angle), radius * sin(angle));

        rotatingElements.push_back(element);
    }
}

void CustomDeckControl::drawRotatingElements(Graphics& g, Rectangle<float> bounds)
{
    if (rotatingElements.empty())
        return;

    auto centre = bounds.getCentre();

    // Use different colors for each deck
    Colour elementColor = (deckNumber == 1) ? Colour(0xFFE74C3C) : Colour(0xFF3498DB); // Red for deck 1, Blue for deck 2

    for (size_t i = 0; i < rotatingElements.size(); ++i)
    {
        // Calculate position with rotation
        float angle = (2.0f * MathConstants<float>::pi * i) / rotatingElements.size() + elementRotationAngle;
        float radius = 70.0f;

        float x = centre.x + radius * cos(angle);
        float y = centre.y + radius * sin(angle);

        // Draw rotating rectangle
        Rectangle<float> element(x - 4, y - 2, 8, 4);

        // Add glow effect first
        g.setColour(elementColor.withAlpha(0.3f));
        g.fillRoundedRectangle(element.expanded(2), 3.0f);

        // Draw main element
        g.setColour(elementColor);
        g.fillRoundedRectangle(element, 2.0f);
    }
}
