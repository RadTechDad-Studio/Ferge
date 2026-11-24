export const original = `# Create a window and draw a 3D cube

import pygame
from pygame.locals import *
import numpy as np

# Initialize Pygame
pygame.init()

# Set up the display
width, height = 800, 600
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption('3D Cube')

# Define cube vertices and edges
vertices = np.array([[1, 1, 1],
                     [1, 1, -1],
                     [1, -1, -1],
                     [1, -1, 1],
                     [-1, 1, 1],
                     [-1, 1, -1],
                     [-1, -1, -1],
                     [-1, -1, 1]])

edges = [(0, 1), (1, 2), (2, 3), (3, 0),
         (4, 5), (5, 6), (6, 7), (7, 4),
         (0, 4), (1, 5), (2, 6), (3, 7)]

# Function to draw the cube
def draw_cube():
    for edge in edges:
        points = []
        for vertex in edge:
            x, y, z = vertices[vertex]
            # Simple perspective projection
            f = 200 / (z + 5)
            x, y = x * f, y * f
            points.append((x + width / 2, y + height / 2))
        pygame.draw.line(screen, (255, 255, 255), *points, 2)

# Main application loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill((0, 0, 0))
    draw_cube()
    pygame.display.flip()

pygame.quit()`;
export const modified = `# Create a window and draw a 3D character

import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

def draw_girl():
    # Drawing a simple representation of a 3D girl
    glBegin(GL_QUADS)

    # Body
    glColor3f(1.0, 0.5, 0.5)
    glVertex3f(-0.5, -1, 0)
    glVertex3f(0.5, -1, 0)
    glVertex3f(0.5, 1, 0)
    glVertex3f(-0.5, 1, 0)

    # Head
    glColor3f(1.0, 0.8, 0.6)
    glVertex3f(-0.3, 1, 0)
    glVertex3f(0.3, 1, 0)
    glVertex3f(0.3, 1.5, 0)
    glVertex3f(-0.3, 1.5, 0)

    glEnd()

def main():
    pygame.init()
    display = (800, 600)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)
    gluPerspective(45, (display[0] / display[1]), 0.1, 50.0)
    glTranslatef(0.0, 0.0, -5)

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        glRotatef(1, 0, 1, 0)
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        draw_girl()
        pygame.display.flip()
        pygame.time.wait(10)

if __name__ == '__main__':
    main()`;

const baseExample = `export function compare(a, b) {
  const left = normalize(a);
  const right = normalize(b);

  return {
    equal: left === right,
    left,
    right,
  };
}

function normalize(text) {
  return text.trim();
}

export const options = {
  ignoreWhitespace: false,
  showLineNumbers: true,
  highlightSyntax: true,
  theme: "light",
};

export function summarize(result) {
  return result.equal
    ? "No differences"
    : "Changes found";
}`;
export const demoFiles = [
  { name: "baseline.js", text: baseExample },
  {
    name: "draft.js",
    text: baseExample
      .replace("text.trim()", "text.trim().toLowerCase()")
      .replace("ignoreWhitespace: false", "ignoreWhitespace: true"),
  },
  {
    name: "revised.js",
    text: baseExample
      .replace(
        "const right = normalize(b);",
        "const right = normalize(b);\n  const changed = left !== right;",
      )
      .replace("equal: left === right,", "equal: !changed,\n    changed,")
      .replace('"Changes found"', '"Review your changes"'),
  },
  {
    name: "final.js",
    text: baseExample
      .replace("text.trim()", 'text.trim().replace(/ +/g, " ")')
      .replace('theme: "light",', 'theme: "system",\n  linkScrolling: true,')
      .replace('"No differences"', '"Files are identical"'),
  },
];

const invitation = `COMMUNITY GARDEN AFTERNOON

Hello neighbors,

Join us on Saturday to plant the spring beds.
Meet at the garden gate at 10:00 a.m.

What to bring
- A water bottle
- Your own gloves
- A folding chair

We will finish at noon.
Please reply by Thursday.

See you in the garden!`;

const weekend = `WEEKEND PLAN

Saturday
09:00 - Breakfast at home
10:00 - Walk along the river
12:30 - Picnic in the park
15:00 - Visit the museum
18:00 - Cook dinner together

Sunday
09:30 - Coffee and a slow morning
11:00 - Browse the bookshop
13:00 - Lunch at home
15:00 - Head home

Pack a jacket and a water bottle.
Keep the afternoon flexible.`;

const soup = `TOMATO SOUP
Serves 4

Ingredients
- 2 tablespoons olive oil
- 1 onion, diced
- 2 cloves garlic, minced
- 800 g canned tomatoes
- 500 ml vegetable stock
- 1 teaspoon dried basil
- Salt and pepper

Method
1. Warm the oil in a large pot.
2. Cook the onion for 5 minutes.
3. Add the garlic and stir for 1 minute.
4. Add tomatoes, stock, and basil.
5. Simmer for 20 minutes.
6. Blend until smooth.
7. Season to taste.

Serve with crusty bread.`;

const cppExample = `#include <iostream>
#include <vector>

int clampReading(int value, int low, int high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

int main() {
  const std::vector<int> readings{-5, 12, 30, 120};

  for (int reading : readings) {
    std::cout << clampReading(reading, 0, 100);
    std::cout << std::endl;
  }

  return 0;
}`;

const pythonExample = `def parse_tags(text):
    return text.split(",")


def summarize(tags):
    return f"{len(tags)} tags: {', '.join(tags)}"


if __name__ == "__main__":
    sample = "Code, design, , code, docs"
    tags = parse_tags(sample)
    print(summarize(tags))`;

// Independent sample sets: compare each version with the first file, then try
// copying individual regions. Keep demoFiles unchanged for the original demo.
export const exampleSets = [
  {
    id: "invitation",
    label: "2 files · Invitation",
    description: "An original invitation and its revision: compare wording, added details, and removed items.",
    files: [
      { name: "invitation-original.txt", language: "plaintext", text: invitation },
      {
        name: "invitation-revised.txt", language: "plaintext",
        text: invitation
          .replace("Hello neighbors,", "Hello garden friends,")
          .replace("10:00 a.m.", "10:30 a.m.")
          .replace("- Your own gloves\n- A folding chair", "- A sun hat")
          .replace("We will finish at noon.", "Gloves and tools will be provided.\n\nWe will finish at 12:30 p.m.")
          .replace("Please reply by Thursday.", "Please reply by Friday.\nLet us know if you can help set up."),
      },
    ],
  },
  {
    id: "cpp",
    label: "2 files · C++",
    description: "Compare a basic range clamp with a C++17 revision that handles reversed bounds and uses the standard library.",
    files: [
      { name: "clamp-original.cpp", text: cppExample },
      {
        name: "clamp-revised.cpp",
        text: cppExample
          .replace("#include <iostream>", "#include <algorithm>\n#include <iostream>")
          .replace("  if (value < low) return low;\n  if (value > high) return high;\n  return value;", "  const int lower = std::min(low, high);\n  const int upper = std::max(low, high);\n  return std::clamp(value, lower, upper);")
          .replace("readings{-5, 12, 30, 120}", "readings{-5, 0, 12, 30, 100, 120}")
          .replace("    std::cout << clampReading(reading, 0, 100);", "    std::cout << reading << \" -> \";\n    std::cout << clampReading(reading, 100, 0);"),
      },
    ],
  },
  {
    id: "weekend",
    label: "3 files · Weekend plans",
    description: "Compare the original plan with an outdoor version and a rainy-day alternative.",
    files: [
      { name: "weekend-original.txt", language: "plaintext", text: weekend },
      {
        name: "weekend-outdoors.txt", language: "plaintext",
        text: weekend
          .replace("10:00 - Walk along the river", "10:00 - Hike the woodland trail")
          .replace("15:00 - Visit the museum", "15:00 - Rent bikes by the lake")
          .replace("11:00 - Browse the bookshop", "11:00 - Visit the farmers market")
          .replace("Pack a jacket and a water bottle.", "Pack walking shoes and a water bottle.\nBring a picnic blanket."),
      },
      {
        name: "weekend-rainy-day.txt", language: "plaintext",
        text: weekend
          .replace("10:00 - Walk along the river", "10:00 - Visit the museum")
          .replace("12:30 - Picnic in the park", "12:30 - Make lunch together")
          .replace("15:00 - Visit the museum", "15:00 - Board games at home")
          .replace("09:30 - Coffee and a slow morning", "09:30 - Bake pancakes together")
          .replace("13:00 - Lunch at home\n", "")
          .replace("Pack a jacket and a water bottle.", "Pack an umbrella and a favorite game."),
      },
    ],
  },
  {
    id: "python",
    label: "3 files · Python",
    description: "A tag parser evolves from splitting commas to trimming whitespace, skipping blanks, and removing duplicate tags.",
    files: [
      { name: "tags-original.py", text: pythonExample },
      {
        name: "tags-cleaned.py",
        text: pythonExample.replace("    return text.split(\",\")", "    return [\n        tag.strip()\n        for tag in text.split(\",\")\n        if tag.strip()\n    ]"),
      },
      {
        name: "tags-unique.py",
        text: pythonExample
          .replace("    return text.split(\",\")", "    cleaned = [\n        tag.strip().casefold()\n        for tag in text.split(\",\")\n        if tag.strip()\n    ]\n    return list(dict.fromkeys(cleaned))")
          .replace("    return f\"{len(tags)} tags: {', '.join(tags)}\"", "    label = \"tag\" if len(tags) == 1 else \"tags\"\n    return f\"{len(tags)} {label}: {', '.join(tags)}\""),
      },
    ],
  },
  {
    id: "recipe",
    label: "4 files · Soup recipe",
    description: "Try merging ideas from the original, creamy, smoky, and quick versions of one recipe.",
    files: [
      { name: "soup-original.txt", language: "plaintext", text: soup },
      {
        name: "soup-creamy.txt", language: "plaintext",
        text: soup
          .replace("TOMATO SOUP", "CREAMY TOMATO SOUP")
          .replace("- Salt and pepper", "- 100 ml cream\n- Salt and pepper")
          .replace("7. Season to taste.", "7. Stir in the cream.\n8. Season to taste.")
          .replace("Serve with crusty bread.", "Serve with croutons and fresh basil."),
      },
      {
        name: "soup-smoky.txt", language: "plaintext",
        text: soup
          .replace("TOMATO SOUP", "SMOKY TOMATO SOUP")
          .replace("- 2 cloves garlic, minced", "- 3 cloves garlic, minced")
          .replace("- 1 teaspoon dried basil", "- 1 teaspoon smoked paprika\n- A pinch of chili flakes")
          .replace("4. Add tomatoes, stock, and basil.", "4. Add tomatoes, stock, and spices.")
          .replace("5. Simmer for 20 minutes.", "5. Simmer for 25 minutes."),
      },
      {
        name: "soup-quick.txt", language: "plaintext",
        text: soup
          .replace("TOMATO SOUP", "QUICK TOMATO SOUP")
          .replace("- 1 onion, diced\n", "")
          .replace("- 800 g canned tomatoes", "- 800 g crushed tomatoes")
          .replace("- 500 ml vegetable stock", "- 400 ml vegetable stock")
          .replace("2. Cook the onion for 5 minutes.\n3. Add the garlic and stir for 1 minute.", "2. Add the garlic and stir for 1 minute.")
          .replace("4. Add tomatoes, stock, and basil.\n5. Simmer for 20 minutes.\n6. Blend until smooth.\n7. Season to taste.", "3. Add tomatoes, stock, and basil.\n4. Simmer for 10 minutes.\n5. Season to taste."),
      },
    ],
  },
  {
    id: "javascript",
    label: "4 files · JavaScript",
    description: "The original code example: compare changes to a text-comparison function and its options.",
    files: demoFiles,
  },
];
