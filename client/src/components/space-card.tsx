import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Space } from "@shared/schema";

interface SpaceCardProps {
  space: Space;
}

export default function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Card className="shadow-md overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-semibold text-barn-navy" data-testid={`text-space-name-${space.id}`}>
            {space.name}
          </h4>
          <span className="bg-barn-green text-white px-2 py-1 rounded text-sm font-medium" data-testid={`text-space-rate-${space.id}`}>
            ${space.hourlyRate}/hr
          </span>
        </div>
        
        <p className="text-barn-gray text-sm mb-2" data-testid={`text-space-description-${space.id}`}>
          {space.description}
        </p>
        
        <div className="text-xs text-barn-gray mb-3" data-testid={`text-space-equipment-${space.id}`}>
          <span>{space.equipment}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-barn-green text-sm">
            <i className="fas fa-check-circle mr-1"></i>
            <span>Available Today</span>
          </div>
          <Link href={`/booking?spaceId=${space.id}`}>
            <Button 
              className="bg-barn-navy hover:bg-barn-navy/90 text-white px-4 py-2 rounded-lg text-sm font-medium"
              data-testid={`button-select-space-${space.id}`}
            >
              Select
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
