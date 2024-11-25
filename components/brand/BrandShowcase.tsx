'use client';

import { brandConfig } from '@/lib/branding/config';
import { getBrandColor, getBrandGradient } from '@/lib/branding/utils';

function ColorSwatch({ color, shade }: { color: string; shade: number }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-lg shadow-md"
        style={{ backgroundColor: color }}
      />
      <span className="mt-1 text-sm text-gray-600">{shade}</span>
    </div>
  );
}

function GradientSwatch({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-32 h-16 rounded-lg shadow-md"
        style={{ background: gradient }}
      />
      <span className="mt-1 text-sm text-gray-600">{name}</span>
    </div>
  );
}

export function BrandShowcase() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Brand Guidelines</h1>

      {/* Colors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Colors</h2>
        
        <div className="space-y-8">
          {Object.entries(brandConfig.colors).map(([name, shades]) => (
            <div key={name}>
              <h3 className="text-xl font-medium mb-4 capitalize">{name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {Object.entries(shades).map(([shade, color]) => (
                  <ColorSwatch
                    key={shade}
                    color={color}
                    shade={Number(shade)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gradients */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Gradients</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Object.entries(brandConfig.gradients).map(([name, gradient]) => (
            <GradientSwatch key={name} name={name} gradient={gradient} />
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Typography</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Heading Font</h3>
            <p style={{ fontFamily: brandConfig.fonts.heading }}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Body Font</h3>
            <p style={{ fontFamily: brandConfig.fonts.body }}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Container Widths</h2>
        <div className="space-y-4">
          {Object.entries(brandConfig.spacing.container).map(([size, width]) => (
            <div key={size} className="flex items-center space-x-4">
              <span className="w-20 text-sm text-gray-600 capitalize">{size}:</span>
              <div
                className="h-8 bg-blue-100 rounded"
                style={{ width: width }}
              />
              <span className="text-sm text-gray-600">{width}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {Object.entries(brandConfig.borderRadius).map(([size, radius]) => (
            <div key={size} className="flex flex-col items-center">
              <div
                className="w-16 h-16 bg-blue-500"
                style={{ borderRadius: radius }}
              />
              <span className="mt-2 text-sm text-gray-600 capitalize">{size}</span>
              <span className="text-xs text-gray-500">{radius}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Shadows</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {Object.entries(brandConfig.shadows).map(([size, shadow]) => (
            <div key={size} className="flex flex-col items-center">
              <div
                className="w-24 h-24 bg-white rounded-lg"
                style={{ boxShadow: shadow }}
              />
              <span className="mt-2 text-sm text-gray-600 capitalize">{size}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
