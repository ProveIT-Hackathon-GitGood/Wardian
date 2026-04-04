'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, ArrowLeft, ArrowRight, Shield, Stethoscope, Users } from 'lucide-react';
import { HOSPITALS } from '@/lib/mock-data';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerStep, setRegisterStep] = useState(1);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerHospital, setRegisterHospital] = useState('');
  const [registerEmployeeId, setRegisterEmployeeId] = useState('');
  const [registerRole, setRegisterRole] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/dashboard');
  };

  const canProceedToStep2 = registerName.trim() && registerEmail.trim() && registerPassword.trim();

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12">
        <div>
          <img src="/wardian-logo.png" alt="Wardian" className="h-[5rem] w-auto mb-6" />
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-semibold text-foreground leading-tight text-balance" style={{ fontFamily: 'var(--font-heading)' }}>
              Intelligent Ward Management & Sepsis Prevention
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Enterprise-grade hospital monitoring system powered by AI. Real-time patient tracking, early sepsis detection, and clinical decision support.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Early Detection"
              description="AI-powered sepsis risk assessment"
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Ward Overview"
              description="Real-time bed and patient monitoring"
            />
            <FeatureCard
              icon={<Activity className="w-5 h-5" />}
              title="Live Vitals"
              description="Continuous vital signs tracking"
            />
            <FeatureCard
              icon={<Stethoscope className="w-5 h-5" />}
              title="Clinical Tools"
              description="Integrated reporting and analytics"
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Trusted by leading healthcare institutions worldwide
        </p>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/wardian-logo.png" alt="Wardian" className="h-[3.6rem] w-auto mb-4" />
          </div>

          <Tabs defaultValue="login" className="w-full" onValueChange={() => setRegisterStep(1)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        {registerStep === 1 ? 'Create an account' : 'Professional details'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {registerStep === 1
                          ? 'Step 1 of 2 — Account information'
                          : 'Step 2 of 2 — Hospital & role'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <div className={`h-1.5 w-8 rounded-full transition-colors ${registerStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`h-1.5 w-8 rounded-full transition-colors ${registerStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {registerStep === 1 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Dr. John Smith"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="doctor@hospital.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Create a strong password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={!canProceedToStep2}
                        onClick={() => setRegisterStep(2)}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={registerRole} onValueChange={setRegisterRole}>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="nurse">Nurse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hospital">Select Hospital</Label>
                        <Select value={registerHospital} onValueChange={setRegisterHospital}>
                          <SelectTrigger id="hospital">
                            <SelectValue placeholder="Choose your hospital" />
                          </SelectTrigger>
                          <SelectContent>
                            {HOSPITALS.map((hospital) => (
                              <SelectItem key={hospital} value={hospital}>
                                {hospital}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          placeholder="DOC-2024-001"
                          value={registerEmployeeId}
                          onChange={(e) => setRegisterEmployeeId(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setRegisterStep(1)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Creating account...
                            </span>
                          ) : (
                            'Create Account'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border/50">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
