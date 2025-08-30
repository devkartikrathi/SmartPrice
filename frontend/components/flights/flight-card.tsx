"use client";

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type FlightData } from '@/lib/api';
import { Plane, Clock, MapPin, ExternalLink } from 'lucide-react';

interface FlightCardProps {
  flight: FlightData;
}

export function FlightCard({ flight }: FlightCardProps) {
  const formatTime = (time: string) => {
    return new Date(`2025-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Plane className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{flight.airline}</div>
                <div className="text-sm text-muted-foreground">{flight.flightNumber}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">${flight.price}</div>
              <div className="text-sm text-muted-foreground">per person</div>
            </div>
          </div>

          {/* Flight Route */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{formatTime(flight.departure.time)}</div>
              <div className="text-sm text-muted-foreground">{flight.departure.city}</div>
              <div className="text-xs text-muted-foreground">{flight.departure.airport}</div>
            </div>

            <div className="flex-1 mx-4 relative">
              <Separator className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background px-2">
                    <Plane className="h-4 w-4 text-muted-foreground rotate-90" />
                  </div>
                </div>
              </Separator>
              <div className="text-center mt-1">
                <Badge variant="outline" className="text-xs">
                  {flight.duration}
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold">{formatTime(flight.arrival.time)}</div>
              <div className="text-sm text-muted-foreground">{flight.arrival.city}</div>
              <div className="text-xs text-muted-foreground">{flight.arrival.airport}</div>
            </div>
          </div>

          {/* Flight Info */}
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
              {flight.aircraft && (
                <div className="flex items-center">
                  <Plane className="h-4 w-4 mr-1" />
                  {flight.aircraft}
                </div>
              )}
            </div>
            <div className="text-xs">
              {flight.departure.date}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Book Flight
            </Button>
            <Button variant="outline">
              Compare
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}