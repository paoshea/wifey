import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Settings2, MapPin, Bell, Shield, Smartphone } from "lucide-react"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your app settings and preferences",
}

export default function SettingsPage() {
  return (
    <main className="container py-10">
      <div className="grid gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your app settings and preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Location Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Settings
              </CardTitle>
              <CardDescription>
                Configure how your location data is used
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="location-tracking">Background Location Tracking</Label>
                <Switch id="location-tracking" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="location-history">Save Location History</Label>
                <Switch id="location-history" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="coverage-alerts">Coverage Alerts</Label>
                <Switch id="coverage-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="speed-alerts">Speed Test Alerts</Label>
                <Switch id="speed-alerts" />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control your privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-sharing">Share Anonymous Data</Label>
                <Switch id="data-sharing" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics">Usage Analytics</Label>
                <Switch id="analytics" />
              </div>
            </CardContent>
          </Card>

          {/* Device Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Settings
              </CardTitle>
              <CardDescription>
                Configure device-specific settings
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-test">Automatic Speed Tests</Label>
                <Switch id="auto-test" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="battery-saver">Battery Saver Mode</Label>
                <Switch id="battery-saver" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
