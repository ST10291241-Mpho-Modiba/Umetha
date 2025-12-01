// app/dashboard/influencer/shipping/create-shipment.tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Address = {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
};

export default function CreateShipmentPage() {
  const { toast } = useToast();
  const [carrier, setCarrier] = useState("auto");
  const [fromAddress, setFromAddress] = useState<Address>({});
  const [toAddress, setToAddress] = useState<Address>({});
  const [weight, setWeight] = useState<number | "">("");
  const [length, setLength] = useState<number | "">("");
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [serviceCode, setServiceCode] = useState<string>("");
  const [rates, setRates] = useState<any[]>([]);
  const [shippingInfo, setShippingInfo] = useState<any | null>(null);
  const [tracking, setTracking] = useState("");

  const parcel = {
  weight: Number(weight) || 1,
  dimensions: {
    length: Number(length) || 1,
    width: Number(width) || 1,
    height: Number(height) || 1
  }
};


const normalizedFrom = {
  country: fromAddress.country || "US",
  state: fromAddress.state || "CA",
  ...fromAddress
};

const normalizedTo = {
  country: toAddress.country || "US",
  state: toAddress.state || "CA",
  ...toAddress
};






  const fetchShippingRates = async () => {
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  carrier,
  fromAddress: normalizedFrom,
  toAddress: normalizedTo,
  weight: parcel.weight,
  dimensions: parcel.dimensions,
  prefer: "cheapest",
  useNearestWarehouse: true,
}),

      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch rates");
      setRates(data.options);
      toast({ title: "Rates fetched", description: "Choose a rate to create shipment" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    }
  };

  const createShipment = async (selectedCarrier: string, selectedServiceCode: string) => {
    try {
      const res = await fetch("/api/shipping/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: selectedCarrier,
          fromAddress,
          toAddress,
          parcel,
          serviceCode: selectedServiceCode,
          labelFormat: "PDF",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create shipment");
      setShippingInfo(data.result);
      toast({ title: "Shipment created", description: "Shipment created successfully" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    }
  };

  const schedulePickup = async () => {
    try {
      const res = await fetch("/api/shipping/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier,
          pickupDetails: {
            address: fromAddress,
            readyTime: new Date().toISOString(),
            closingTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to schedule pickup");
      toast({ title: "Pickup scheduled", description: "Pickup scheduled successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    }
  };

  const trackShipment = async () => {
    try {
      const res = await fetch("/api/shipping/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier, trackingNumber: tracking }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Track failed");
      toast({ title: "Tracking", description: "Tracking fetched" });
      setShippingInfo(data.result);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    }
  };

  return (
   
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Create Shipment</h2>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>From Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Name" value={fromAddress.name || ""} onChange={(e) => setFromAddress({ ...fromAddress, name: e.target.value })} />
            <Input placeholder="Street" value={fromAddress.street || ""} onChange={(e) => setFromAddress({ ...fromAddress, street: e.target.value })} />
            <Input placeholder="City" value={fromAddress.city || ""} onChange={(e) => setFromAddress({ ...fromAddress, city: e.target.value })} />
            <Input placeholder="Postal Code" value={fromAddress.postalCode || ""} onChange={(e) => setFromAddress({ ...fromAddress, postalCode: e.target.value })} />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>To Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Name" value={toAddress.name || ""} onChange={(e) => setToAddress({ ...toAddress, name: e.target.value })} />
            <Input placeholder="Street" value={toAddress.street || ""} onChange={(e) => setToAddress({ ...toAddress, street: e.target.value })} />
            <Input placeholder="City" value={toAddress.city || ""} onChange={(e) => setToAddress({ ...toAddress, city: e.target.value })} />
            <Input placeholder="Postal Code" value={toAddress.postalCode || ""} onChange={(e) => setToAddress({ ...toAddress, postalCode: e.target.value })} />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Parcel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Weight (lbs)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <Label>Length (in)</Label>
                <Input type="number" value={length} onChange={(e) => setLength(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <Label>Width (in)</Label>
                <Input type="number" value={width} onChange={(e) => setWidth(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="space-y-4">
            <div>
              <Label>Carrier</Label>
              <select className="w-full p-2 border rounded" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                <option value="auto">Auto (Compare carriers)</option>
                <option value="fedex">FedEx</option>
                <option value="ups">UPS</option>
                <option value="dhl">DHL</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={fetchShippingRates}>Get Shipping Rates</Button>
              <Button onClick={schedulePickup} variant="outline">Schedule Pickup</Button>
            </div>

            {rates && rates.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Rate Options</h4>
                {rates.map((opt: any) => (
                  <div key={opt.carrier} className="p-2 border rounded">
                    <div className="font-semibold">{opt.carrier.toUpperCase()}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      {opt.rates.map((r: any, idx: number) => (
                        <div key={idx} className="p-2 border rounded">
                          <div>{r.serviceName}</div>
                          <div>{r.amount} {r.currency}</div>
                          <div>ETA: {r.transitDays ?? "—"}</div>
                          <div className="mt-2">
                            <Button onClick={() => createShipment(opt.carrier, r.serviceName)}>Create Shipment</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {shippingInfo && (
              <div className="mt-4 p-4 border rounded bg-muted">
                <h4 className="font-medium">Shipment Info</h4>
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(shippingInfo, null, 2)}</pre>
              </div>
            )}

            <div className="mt-4">
              <Label>Track</Label>
              <div className="flex gap-2">
                <Input placeholder="Tracking Number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                <Button onClick={trackShipment}>Track</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
   
  );
}
