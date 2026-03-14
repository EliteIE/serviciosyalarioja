import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateReview } from "@/hooks/useReviews";

const MERIT_TAGS = ["Puntual", "Precio Justo", "Prolijo", "Amable", "Rápido", "Recomendado"];

interface ReviewDialogProps {
  serviceRequestId: string;
  reviewedId: string;
  reviewedName: string;
  children: React.ReactNode;
}

const ReviewDialog = ({ serviceRequestId, reviewedId, reviewedName, children }: ReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const createReview = useCreateReview();

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    await createReview.mutateAsync({
      service_request_id: serviceRequestId,
      reviewed_id: reviewedId,
      rating,
      comment: comment || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    setOpen(false);
    setRating(0);
    setComment("");
    setTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calificar a {reviewedName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="p-1"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hover || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {MERIT_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          <Textarea
            placeholder="Contá tu experiencia (opcional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <Button
            className="w-full rounded-xl"
            onClick={handleSubmit}
            disabled={rating === 0 || createReview.isPending}
          >
            Enviar Reseña
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
