import { MapPin, Wifi, Signal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Find Coverage</span>
            <span className="block text-blue-600 hover:text-blue-700 transition-colors duration-300">
              Anywhere
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Locate cellular coverage points and free WiFi hotspots near you. Never be out of touch again.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Link href="/coverage-finder">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Signal className="w-4 h-4 mr-2" />
                Find Coverage Now
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-6 cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
              <Signal className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              Cellular Coverage
            </h3>
            <p className="mt-2 text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
              Find the nearest coverage point when you're in a dead zone
            </p>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-6 cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
              <Wifi className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              Free WiFi
            </h3>
            <p className="mt-2 text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
              Discover nearby free WiFi hotspots
            </p>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-lg p-6 cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 group-hover:bg-blue-600 transition-colors duration-200 text-white">
              <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              Navigation
            </h3>
            <p className="mt-2 text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
              Get turn-by-turn directions to the nearest connection point
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}