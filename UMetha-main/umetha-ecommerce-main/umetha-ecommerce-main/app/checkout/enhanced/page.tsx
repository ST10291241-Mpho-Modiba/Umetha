"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Truck,
  Shield,
  MapPin,
  Calendar,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import MainLayout from "@/components/main-layout";
import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function CheckoutPage() {
  // --- Hooks and State ---
  const { items } = useCart();
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [activeStep, setActiveStep] = useState("shipping");
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("credit-card");

 type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  saveInfo: boolean;
  shippingMethod: string;
  paymentMethod: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvc: string;
  paypalEmail: string;
};

type FormErrors = {
  [key: string]: string;
};

const [formData, setFormData] = useState<FormData>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  saveInfo: true,
  shippingMethod: "standard",
  paymentMethod: "credit-card",
  cardNumber: "",
  cardName: "",
  cardExpiry: "",
  cardCvc: "",
  paypalEmail: "",
});

const [formErrors, setFormErrors] = useState<FormErrors>({});


  // --- Calculated amounts ---
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingCost =
    formData.shippingMethod === "express"
      ? 14.99
      : formData.shippingMethod === "standard"
      ? 4.99
      : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  // --- Helper Functions ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setFormData({ ...formData, cardNumber: formattedValue });
    if (formErrors.cardNumber) setFormErrors({ ...formErrors, cardNumber: "" });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2, 4);
    setFormData({ ...formData, cardExpiry: value });
    if (formErrors.cardExpiry) setFormErrors({ ...formErrors, cardExpiry: "" });
  };

  const validateForm = (step: string) => {
    const errors: Record<string, string> = {};

    if (step === "shipping") {
      if (!formData.firstName) errors.firstName = "First name is required";
      if (!formData.lastName) errors.lastName = "Last name is required";
      if (!formData.email) errors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid";
      if (!formData.address) errors.address = "Address is required";
      if (!formData.city) errors.city = "City is required";
      if (!formData.postalCode) errors.postalCode = "Postal code is required";
    } else if (step === "payment") {
      if (!selectedPaymentMethod) errors.paymentMethod = "Please select a payment method";
      if (selectedPaymentMethod === "credit-card") {
        if (!formData.cardNumber) errors.cardNumber = "Card number is required";
        if (!formData.cardName) errors.cardName = "Cardholder name is required";
        if (!formData.cardExpiry) errors.cardExpiry = "Expiry date is required";
        if (!formData.cardCvc) errors.cardCvc = "CVC is required";
      } else if (selectedPaymentMethod === "paypal") {
        if (!formData.paypalEmail) errors.paypalEmail = "PayPal email is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm(activeStep)) {
      setActiveStep(activeStep === "shipping" ? "payment" : "shipping");
    }
  };

  const handleBack = () => {
    if (activeStep === "payment") setActiveStep("shipping");
  };

  // --- Async functions for order and payment ---
  const createOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id,
        total_amount: total,
        shipping_address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        payment_method: selectedPaymentMethod,
        order_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        status: "processing",
        payment_status: "paid",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const simulatePaymentProcess = async () => {
    return { success: true };
  };

  const handleSubmitOrder = async () => {
    if (!validateForm("payment")) return;
    setIsProcessing(true);

    try {
      const paymentResult = await simulatePaymentProcess();

      if (paymentResult.success) {
        const orderId = await createOrder();
        toast({
          title: "Order placed successfully!",
          description: "Redirecting you to order tracking...",
           variant: "default",
        });
        router.push(`/orders/${orderId}`);
      } else {
        toast({
          title: "Payment failed",
          description: "Please try again or use a different payment method.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected error",
        description: "Something went wrong during checkout.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Load user profile if logged in ---
  useEffect(() => {
    async function loadUserProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) return;

      setFormData((prevData) => ({
        ...prevData,
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: user.email || "",
        phone: data.phone_number || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        postalCode: data.postal_code || "",
        country: data.country || "United States",
      }));
    }

    loadUserProfile();
  }, [user, supabase]);


  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/cart" className="text-indigo-600 hover:underline flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
          <p className="text-gray-500 mt-2">Complete your purchase securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Shipping Information */}
            {activeStep === "shipping" && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Form Inputs for Shipping */}
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`mt-1 ${formErrors.firstName ? "border-red-500" : ""}`}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`mt-1 ${formErrors.lastName ? "border-red-500" : ""}`}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 ${formErrors.email ? "border-red-500" : ""}`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`mt-1 ${formErrors.address ? "border-red-500" : ""}`}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`mt-1 ${formErrors.city ? "border-red-500" : ""}`}
                      />
                      {formErrors.city && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className={`mt-1 ${formErrors.postalCode ? "border-red-500" : ""}`}
                      />
                      {formErrors.postalCode && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.postalCode}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Separator className="my-8" />
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Method</h3>
                <RadioGroup
                  name="shippingMethod"
                  value={formData.shippingMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shippingMethod: value })
                  }
                  className="grid gap-4"
                >
                  {[
                    { id: "standard", name: "Standard Shipping", price: 4.99, description: "Delivery in 3-5 business days", icon: Truck },
                    { id: "express", name: "Express Shipping", price: 14.99, description: "Delivery in 1-2 business days", icon: MapPin },
                    { id: "pickup", name: "Store Pickup", price: 0, description: "Ready for pickup in 24 hours", icon: Calendar },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <motion.div
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        className={`relative flex items-center space-x-4 rounded-lg border p-4 ${formData.shippingMethod === method.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                      >
                        <RadioGroupItem value={method.id} id={`shipping-${method.id}`} className="absolute right-4" />
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`shipping-${method.id}`} className="text-base font-medium cursor-pointer">{method.name}</Label>
                            <span className="text-sm font-semibold text-indigo-700">${method.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </RadioGroup>

                <div className="mt-8 flex justify-end">
                  <Button onClick={handleContinue} className="bg-indigo-600 text-white px-6 py-4 rounded-lg">
                    Continue to Payment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  <span>Free shipping on orders over $100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
