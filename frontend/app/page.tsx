"use client";

import { useState } from "react";
import { Phone, Building2, User, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WelcomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    service: "",
    phone: "",
    agentName: "",
  });

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    localStorage.setItem("companyData", JSON.stringify(formData));
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Phone className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI Call System</h1>
          <p className="text-muted-foreground mt-2">
            Automate your customer calls with AI
          </p>
        </div>

        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Register your company to start making AI-powered calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Your Company Name"
                        className="pl-10"
                        required
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Service Provided
                    </label>
                    <Input
                      placeholder="e.g., Financial Consulting, Tech Support"
                      required
                      value={formData.service}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          service: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Caller Phone Number
                    </label>
                    <div className="relative">
                      <PhoneCall className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Agent Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Name for your AI Agent"
                        className="pl-10"
                        required
                        value={formData.agentName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            agentName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Login to access your AI call dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Your Company Name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input type="password" required />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
