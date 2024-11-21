'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Signal, MapPin, Users, Send, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: "Maria Rodriguez",
    location: "San José, Costa Rica",
    image: "/testimonials/maria.jpg",
    text: "Thanks to the X marks feature, we found signal in a remote area where we were stuck. The community's contributions literally saved our day!",
    rating: 5
  },
  {
    name: "John Smith",
    location: "Tamarindo, Costa Rica",
    image: "/testimonials/john.jpg",
    text: "Working remotely became possible in areas I never thought would have coverage. The coverage map is incredibly accurate!",
    rating: 5
  },
  {
    name: "Ana Chen",
    location: "Monteverde, Costa Rica",
    image: "/testimonials/ana.jpg",
    text: "Found emergency signal during a hiking trip thanks to marked spots. This app is a game-changer for safety!",
    rating: 5
  }
];

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    interests: '',
  });

  const handleOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
    if (step === 3) {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Find Signal. Mark Spots. Help Others.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join our community in mapping cellular coverage across Costa Rica. Every mark helps someone stay connected.
            </p>
            <Button
              size="lg"
              onClick={() => setStep(1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg"
            >
              Get Started
              <ChevronRight className="ml-2" />
            </Button>
          </motion.div>
        </div>

        {/* Floating Features */}
        <div className="container mx-auto px-4 mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent>
                  <Signal className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Find Coverage</h3>
                  <p className="text-gray-600">
                    Discover areas with strong signal strength for reliable connectivity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent>
                  <MapPin className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Mark Spots</h3>
                  <p className="text-gray-600">
                    Contribute to the community by marking areas with good coverage.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent>
                  <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Help Others</h3>
                  <p className="text-gray-600">
                    Your contributions help travelers and locals stay connected.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Onboarding Dialog */}
      {step < 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <Card className="max-w-md w-full bg-white">
            <CardContent className="p-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={step}
              >
                <h2 className="text-2xl font-bold mb-4">
                  {step === 1 && "Tell us your name"}
                  {step === 2 && "Where are you located?"}
                  {step === 3 && "What interests you most?"}
                </h2>
                <form onSubmit={handleOnboarding} className="space-y-4">
                  {step === 1 && (
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  )}
                  {step === 2 && (
                    <Input
                      placeholder="Your location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  )}
                  {step === 3 && (
                    <Input
                      placeholder="What brings you here?"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      required
                    />
                  )}
                  <Button type="submit" className="w-full">
                    {step === 3 ? "Complete" : "Next"}
                  </Button>
                </form>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Success Stories from Our Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-gray-600">{testimonial.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
            <Card>
              <CardContent className="p-6">
                <form className="space-y-4">
                  <Input placeholder="Your Name" />
                  <Input type="email" placeholder="Your Email" />
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none h-32"
                    placeholder="Your Message"
                  />
                  <Button className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
