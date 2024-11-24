import React from 'react';
import Image from 'next/image';
import { brandConfig } from '@/lib/branding';

export const BrandShowcase: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      {/* Logo Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Brand Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="font-semibold mb-4">Primary Logo</h3>
            <Image
              src={brandConfig.assets.logo}
              alt="Wifey Logo"
              width={180}
              height={48}
              className="dark:invert"
            />
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="font-semibold mb-4">App Icon</h3>
            <Image
              src={brandConfig.assets.appIcon}
              alt="Wifey App Icon"
              width={64}
              height={64}
            />
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="font-semibold mb-4">Favicon</h3>
            <Image
              src={brandConfig.assets.favicon}
              alt="Wifey Favicon"
              width={32}
              height={32}
            />
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Color Palette</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Primary Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(brandConfig.colors.primary).map(([shade, color]) => (
                <div key={shade} className="space-y-2">
                  <div
                    className="w-full h-20 rounded-lg"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-sm font-mono">{color}</p>
                  <p className="text-sm text-gray-600">{shade}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Secondary Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(brandConfig.colors.secondary).map(([shade, color]) => (
                <div key={shade} className="space-y-2">
                  <div
                    className="w-full h-20 rounded-lg"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-sm font-mono">{color}</p>
                  <p className="text-sm text-gray-600">{shade}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Accent Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {['success', 'warning', 'error'].map((type) => (
                <div key={type} className="space-y-2">
                  <div
                    className="w-full h-20 rounded-lg"
                    style={{ backgroundColor: brandConfig.colors[type] }}
                  />
                  <p className="text-sm font-mono">{brandConfig.colors[type]}</p>
                  <p className="text-sm text-gray-600">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Typography</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold mb-4">Font Families</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="font-semibold">Sans Serif</p>
                <p style={{ fontFamily: brandConfig.typography.fontFamily.sans.join(', ') }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div className="space-y-4">
                <p className="font-semibold">Monospace</p>
                <p style={{ fontFamily: brandConfig.typography.fontFamily.mono.join(', ') }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Font Sizes</h3>
            <div className="space-y-4">
              {Object.entries(brandConfig.typography.fontSize).map(([name, size]) => (
                <div key={name} className="flex items-center space-x-4">
                  <p className="w-20 text-sm text-gray-600">{name}</p>
                  <p style={{ fontSize: size }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Spacing</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(brandConfig.spacing).map(([name, space]) => (
            <div key={name} className="space-y-2">
              <div className="bg-blue-100 rounded" style={{ width: space, height: space }} />
              <p className="text-sm font-mono">{space}</p>
              <p className="text-sm text-gray-600">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gradients */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(brandConfig.gradients).map(([name, gradient]) => (
            <div key={name} className="space-y-2">
              <div
                className="w-full h-32 rounded-lg"
                style={{ background: gradient }}
              />
              <p className="text-sm font-mono">{gradient}</p>
              <p className="text-sm text-gray-600">{name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
