'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Signal, Navigation2 } from 'lucide-react';
import CoverageRouteMap from '@/components/coverage/coverage-route-map';
import FreeWifiMap from '@/components/coverage/free-wifi-map';
import 'leaflet/dist/leaflet.css';

export default function CoverageFinder() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Coverage Finder</h1>
      
      <Tabs defaultValue="coverage-route">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="coverage-route">
            <Signal className="w-4 h-4 mr-2" />
            Find Coverage Route
          </TabsTrigger>
          <TabsTrigger value="free-wifi">
            <Wifi className="w-4 h-4 mr-2" />
            Free WiFi Hotspots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coverage-route">
          <Card>
            <CardHeader>
              <CardTitle>Find Route to Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverageRouteMap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free-wifi">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Free WiFi Hotspots</CardTitle>
            </CardHeader>
            <CardContent>
              <FreeWifiMap />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}