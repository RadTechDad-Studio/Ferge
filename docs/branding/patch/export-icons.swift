// Run from this folder: swift export-icons.swift
// Uses macOS AppKit's SVG renderer. No third-party dependencies.
import AppKit
import Foundation

let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let svgFolder = root.appendingPathComponent("svg")
let pngFolder = root.appendingPathComponent("png")
try FileManager.default.createDirectory(at: pngFolder, withIntermediateDirectories: true)
let files = try FileManager.default.contentsOfDirectory(at: svgFolder, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension == "svg" }.sorted { $0.lastPathComponent < $1.lastPathComponent }

for file in files {
    guard let artwork = NSImage(contentsOf: file) else { fatalError("Could not load \(file.path)") }
    for size in [1024, 2048, 4096] {
        guard let canvas = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
            let bitmap = canvas.retagging(with: .sRGB),
            let context = NSGraphicsContext(bitmapImageRep: bitmap) else { fatalError("Could not create canvas") }
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = context
        context.imageInterpolation = .high
        artwork.draw(in: NSRect(x: 0, y: 0, width: size, height: size),
            from: .zero, operation: .copy, fraction: 1)
        context.flushGraphics()
        NSGraphicsContext.restoreGraphicsState()
        guard let png = bitmap.representation(using: .png, properties: [:]) else { fatalError("PNG encoding failed") }
        let name = "\(file.deletingPathExtension().lastPathComponent)-\(size).png"
        try png.write(to: pngFolder.appendingPathComponent(name))
        print(name)
    }
}
