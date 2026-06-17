# Focus Timer UI Concept

## Layout

- Display **3 timer cards** by default:
  - **Relaxed** (left)
  - **Standard** (center)
  - **Focused / Locked In** (right)

- The **center card** is:
  - The default selected card
  - Larger than the cards on both sides
  - Visually emphasized

## Card Behavior

When a user selects a card:

1. The selected card:
   - Moves to the center
   - Becomes the largest card

2. Other cards:
   - Shift away from the center
   - Become progressively smaller the farther they are from the center

### Example

Default:

```
[Relaxed]   [Standard]   [Focused]
  Small       Large        Small
```

User selects **Focused**:

```
[Relaxed]   [Standard]   [Focused]
 Smaller      Small        Large
```

User selects **Relaxed**:

```
[Relaxed]   [Standard]   [Focused]
  Large       Small      Smaller
```

## Custom Timer

- Users can create a custom timer.
- Custom timer appears as an additional selectable card.
- Allows flexibility beyond the preset modes.

## Controls

Place controls directly below the card carousel:

- Start
- Pause
- Resume
- Reset (optional)

Controls should remain easily accessible while viewing the cards.


## Active Session Mode

When the user presses **Start**:

* The selected timer card expands smoothly outward to occupy most or all of the available screen space.
* Non-selected timer cards are hidden from view.
* Timer controls remain accessible.
* The expanded card becomes the primary focus of the interface.

### Finish Session

While a timer is active:

* Display a **Finish** button (or **X** button) within the expanded timer view.
* Clicking **Finish** immediately ends the current session.
* The expanded timer card smoothly shrinks back to its selected state within the carousel.
* Hidden cards become visible again.
* The carousel returns to its normal layout.

## Theme

### Style

- Charcoal Ash theme
- Dark UI

### Colors

- Near-black background
- Not pure black
- Not gray
- Soft charcoal tones with subtle contrast

### Feel

- Clean
- Modern
- Minimal
- Focus-oriented
- Low visual distraction

## Visual Hierarchy

1. Selected card (largest)
2. Adjacent cards (smaller)
3. Cards farther from center (smallest)

The layout should create a smooth carousel effect where the selected timer mode always occupies the center and receives the most visual attention.

## Design Style

* Minimalist and modern
* Inspired by Gemini's clean layout
* Focus-first experience
* Dark Charcoal Ash theme
* Consistent spacing and typography
* Minimal visual clutter

## Navigation

* Simple and intuitive
* Few buttons and actions
* Easy access to major features
* Avoid deep menus

## Layout

* Content-focused design
* Study materials should occupy most of the screen
* Timer remains visible but unobtrusive
* Clear visual hierarchy


## User Experience

* Easy to learn
* Distraction-free
* Clean and organized

## Animations

* Smooth and subtle
* Used only to improve navigation and interaction
* Avoid excessive effects
