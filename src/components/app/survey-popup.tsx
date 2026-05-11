'use client';

import { useState, useEffect } from 'react';
import { Star, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SurveyPopupProps {
    currentView: string;
}

const SURVEY_QUESTIONS = [
    { id: 1, text: "Você está gostando da Asa Food?", view: "restaurant" },
    { id: 2, text: "O que achou da Análise Geral?", view: "my-analyses" },
    { id: 3, text: "Avalie a qualidade do Diagnóstico de Performance.", view: "action-plan" },
    { id: 4, text: "Quanto você recomenda a Asa Food para um amigo?", view: "hub" },
];

const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours

export function SurveyPopup({ currentView }: SurveyPopupProps) {
    const [activeSurvey, setActiveSurvey] = useState<typeof SURVEY_QUESTIONS[0] | null>(null);
    const [rating, setRating] = useState<number>(0);
    const [hover, setHover] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;

        const checkSurvey = () => {
            const storageData = localStorage.getItem(`asafood_survey_${user.uid}`);
            const status = storageData ? JSON.parse(storageData) : { answered: [], lastShown: 0 };
            
            // Find if there's a survey for the current view that hasn't been answered
            const surveyForView = SURVEY_QUESTIONS.find(q => q.view === currentView && !status.answered.includes(q.id));
            
            if (surveyForView) {
                const now = Date.now();
                const timeSinceLastShown = now - (status.lastShown || 0);
                
                if (timeSinceLastShown > COOLDOWN_MS) {
                    setActiveSurvey(surveyForView);
                    // Small delay for entrance animation
                    setTimeout(() => setIsVisible(true), 1000);
                }
            } else {
                setIsVisible(false);
                setTimeout(() => setActiveSurvey(null), 500);
            }
        };

        checkSurvey();
    }, [currentView, user]);

    const handleLater = () => {
        if (!user) return;
        setIsVisible(false);
        const storageData = localStorage.getItem(`asafood_survey_${user.uid}`);
        const status = storageData ? JSON.parse(storageData) : { answered: [], lastShown: 0 };
        
        status.lastShown = Date.now();
        localStorage.setItem(`asafood_survey_${user.uid}`, JSON.stringify(status));
        
        setTimeout(() => setActiveSurvey(null), 500);
    };

    const handleSubmit = async () => {
        if (rating === 0 || !activeSurvey || !firestore || !user) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'surveys'), {
                questionId: activeSurvey.id,
                questionText: activeSurvey.text,
                rating,
                comment: comment.trim(),
                view: activeSurvey.view,
                userId: user.uid,
                userEmail: user.email,
                createdAt: serverTimestamp(),
            });

            const storageData = localStorage.getItem(`asafood_survey_${user.uid}`);
            const status = storageData ? JSON.parse(storageData) : { answered: [], lastShown: 0 };
            
            status.answered.push(activeSurvey.id);
            status.lastShown = Date.now();
            localStorage.setItem(`asafood_survey_${user.uid}`, JSON.stringify(status));

            toast({
                title: "Obrigado pelo feedback!",
                description: "Sua resposta ajuda a melhorar a Asa Food."
            });
            
            setIsVisible(false);
            setTimeout(() => {
                setActiveSurvey(null);
                setComment('');
                setRating(0);
            }, 500);
        } catch (error) {
            console.error('Erro ao enviar pesquisa:', error);
            toast({
                variant: "destructive",
                title: "Erro ao enviar",
                description: "Tente novamente mais tarde."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!activeSurvey) return null;

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-[100] w-[90vw] max-w-[400px] transition-all duration-500 ease-out transform",
            isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95 pointer-events-none"
        )}>
            <div className="bg-primary/95 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
                
                <button 
                    onClick={handleLater}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                    <h4 className="text-lg font-black tracking-tight mb-2 pr-6">
                        {activeSurvey.text}
                    </h4>
                    <p className="text-white/60 text-xs mb-6 uppercase tracking-widest font-bold">
                        Pesquisa Rápida
                    </p>

                    <div className="flex justify-between items-center gap-1 mb-6">
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
                                        "w-8 h-8 md:w-10 md:h-10 transition-colors",
                                        (hover || rating) >= star 
                                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" 
                                            : "text-white/20"
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <Textarea 
                            placeholder="Deixe um comentário (opcional)..."
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-1 focus:ring-white/40 resize-none rounded-xl text-sm"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className="w-full rounded-full h-12 bg-white text-primary font-black uppercase tracking-widest hover:bg-white/90 shadow-lg"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Enviar Resposta"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleLater}
                            className="w-full text-white/60 hover:text-white hover:bg-white/10 rounded-full font-bold text-xs"
                        >
                            Responder depois
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
