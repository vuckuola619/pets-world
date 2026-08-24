"use client";

import React from "react";
import { useAnimalDetails } from "@/hooks/useAnimalDetails";
import { Shield, Zap, Palette, Users, Target, Sparkles, Clock, Baby } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { t } from "@/lib/i18n";

interface Props {
  animalName: string;
}

/** Enriched data section powered by API-Ninjas */
export default function AnimalDetailsClient({ animalName }: Props): React.JSX.Element {
  const locale = useMapStore(s => s.locale);
  const { details, loading } = useAnimalDetails(animalName);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground font-[var(--font-heading)]">
          {t(locale).details.extendedData}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-xl h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!details?.characteristics) return <></>;

  const chars = details.characteristics;

  // Build enrichment cards from available data
  const cards: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (chars.top_speed) cards.push({ icon: <Zap size={16} />, label: t(locale).details.topSpeed, value: chars.top_speed });
  if (chars.biggest_threat) cards.push({ icon: <Shield size={16} />, label: t(locale).details.biggestThreat, value: chars.biggest_threat });
  if (chars.most_distinctive_feature) cards.push({ icon: <Sparkles size={16} />, label: t(locale).details.distinctiveFeature, value: chars.most_distinctive_feature });
  if (chars.group_behavior) cards.push({ icon: <Users size={16} />, label: t(locale).details.groupBehavior, value: chars.group_behavior });
  if (chars.skin_type) cards.push({ icon: <Palette size={16} />, label: t(locale).details.skinType, value: chars.skin_type });
  if (chars.prey) cards.push({ icon: <Target size={16} />, label: t(locale).details.prey, value: chars.prey });
  if (chars.gestation_period) cards.push({ icon: <Clock size={16} />, label: t(locale).details.gestationPeriod, value: chars.gestation_period });
  if (chars.age_of_sexual_maturity) cards.push({ icon: <Baby size={16} />, label: t(locale).details.sexualMaturity, value: chars.age_of_sexual_maturity });
  if (chars.color) cards.push({ icon: <Palette size={16} />, label: t(locale).details.colors, value: chars.color });

  if (cards.length === 0) return <></>;

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-lg font-semibold text-foreground font-[var(--font-heading)] mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: 'var(--natura-ocean)' }} />
        {t(locale).details.extendedProfile}
        <span className="text-[10px] font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
          {t(locale).details.viaApiNinjas}
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="group glass-card rounded-xl px-4 py-3 hover:shadow-md transition-all duration-200 animate-fade-in-up"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-muted-foreground group-hover:text-primary transition-colors duration-200">
                {card.icon}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Slogan */}
      {chars.slogan && (
        <div
          className="mt-4 glass-card rounded-xl px-5 py-4 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            &ldquo;{chars.slogan}&rdquo;
          </p>
        </div>
      )}
    </section>
  );
}
