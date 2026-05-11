'use client';

import { useState } from 'react';
import { Star, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StarRatingProps {
    analysisId?: string;
    analysisType: 'performance' | 'general';
    restaurantName: string;
}

export function StarRating({ analysisId, analysisType, restaurantName }: StarRatingProps) {
    const [rating, setRating] = useState<number>(0);
    const [hover, setHover] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                variant: "destructive",
                title: "Selecione uma nota",
                description: "Por favor, selecione de 1 a 5 estrelas para enviar sua avaliação."
            });
            return;
        }

        if (!firestore || !user) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'evaluations'), {
                analysisId: analysisId || 'unknown',
                analysisType,
                restaurantName,
                rating,
                comment: comment.trim(),
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'Usuário Asa Food',
                createdAt: serverTimestamp(),
            });
            setIsSubmitted(true);
            toast({
                title: "Avaliação enviada!",
                description: "Obrigado por nos ajudar a melhorar a Asa Food."
            });
        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            toast({
                variant: "destructive",
                title: "Erro ao enviar",
                description: "Não foi possível salvar sua avaliação. Tente novamente mais tarde."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="bg-card/30 rounded-3xl p-8 text-center animate-fade-up shadow-xl backdrop-blur-md">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Obrigado pela sua avaliação!</h3>
                <p className="text-muted-foreground text-sm">Seu feedback é fundamental para continuarmos evoluindo nosso time.</p>
            </div>
        );
    }

    return (
        <div className="bg-card/30 rounded-3xl p-8 md:p-10 text-center animate-fade-up shadow-xl backdrop-blur-md">
            <h3 className="text-2xl font-extrabold mb-2 text-gradient">O que achou desta análise?</h3>
            <p className="text-muted-foreground mb-8 text-sm md:text-base">Sua avaliação opcional nos ajuda a entregar diagnósticos cada vez mais precisos.</p>
            
            <div className="flex justify-center items-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="transition-all duration-200 hover:scale-125 focus:outline-none"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(star)}
                    >
                        <Star
                            className={cn(
                                "w-10 h-10 md:w-12 md:h-12 transition-colors",
                                (hover || rating) >= star 
                                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
                                    : "text-muted-foreground/30"
                            )}
                        />
                    </button>
                ))}
            </div>

            <div className="max-w-md mx-auto mb-8">
                <Textarea 
                    placeholder="Conte-nos mais sobre sua experiência (opcional)..."
                    className="rounded-2xl border-primary bg-white/5 focus:ring-1 focus:ring-primary min-h-[100px] resize-none text-foreground placeholder:text-muted-foreground/50"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
            </div>

            <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="rounded-full h-14 px-10 font-bold uppercase tracking-widest min-w-[200px]"
            >
                {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Avaliação
                    </>
                )}
            </Button>
        </div>
    );
}
