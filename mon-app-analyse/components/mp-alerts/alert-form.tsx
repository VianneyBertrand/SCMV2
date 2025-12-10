"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/componentsv2/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentsv2/ui/select";
import { StepperInput } from "@/components/simulation/StepperInput";
import type {
  MPAlertConfig,
  AlertType,
  AlertPeriod,
  PriceDirection,
} from "@/types/mp-alerts";
import { periodLabels, directionLabels, validateAlertConfig } from "@/lib/alert-utils";

interface AlertFormProps {
  initialValues?: Partial<MPAlertConfig>;
  onSubmit: (values: MPAlertConfig) => void;
  onCancel?: () => void;
  submitLabel: string;
  defaultUnit?: string;
}

export function AlertForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  defaultUnit = "€/t",
}: AlertFormProps) {
  const [alertType, setAlertType] = useState<AlertType>(
    initialValues?.type || "variation"
  );
  const [threshold, setThreshold] = useState<string>(
    initialValues?.type === "variation"
      ? String(initialValues.threshold || "5")
      : "5"
  );
  const [period, setPeriod] = useState<AlertPeriod>(
    initialValues?.type === "variation"
      ? initialValues.period || "week"
      : "week"
  );
  const [priceThreshold, setPriceThreshold] = useState<string>(
    initialValues?.type === "price_threshold"
      ? String(initialValues.priceThreshold || "350")
      : "350"
  );
  const [direction, setDirection] = useState<PriceDirection>(
    initialValues?.type === "price_threshold"
      ? initialValues.direction || "above"
      : "above"
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setAlertType(initialValues.type || "variation");
      if (initialValues.type === "variation") {
        setThreshold(String(initialValues.threshold || "5"));
        setPeriod(initialValues.period || "week");
      } else if (initialValues.type === "price_threshold") {
        setPriceThreshold(String(initialValues.priceThreshold || "350"));
        setDirection(initialValues.direction || "above");
      }
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let config: MPAlertConfig;

    if (alertType === "variation") {
      config = {
        type: "variation",
        threshold: parseFloat(threshold) || 0,
        period,
      };
    } else {
      config = {
        type: "price_threshold",
        priceThreshold: parseFloat(priceThreshold) || 0,
        direction,
        unit: defaultUnit,
      };
    }

    const validation = validateAlertConfig(config);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-base text-muted-foreground mb-3">M'alerter si :</div>

      {/* Option 1: Variation */}
      <div className="space-y-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="alertType"
            value="variation"
            checked={alertType === "variation"}
            onChange={() => setAlertType("variation")}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-base">Variation dépasse</span>
        </label>

        {alertType === "variation" && (
          <div className="flex items-center gap-2 ml-6">
            <StepperInput
              value={threshold}
              unit="%"
              onChange={(newValue) => setThreshold(String(newValue))}
              onIncrement={(shift) => {
                const current = parseFloat(threshold) || 0;
                const step = shift ? 1 : 0.1;
                setThreshold(String(Math.round((current + step) * 10) / 10));
              }}
              onDecrement={(shift) => {
                const current = parseFloat(threshold) || 0;
                const step = shift ? 1 : 0.1;
                const newVal = Math.max(0.1, Math.round((current - step) * 10) / 10);
                setThreshold(String(newVal));
              }}
              min={0.1}
              className="w-32"
            />
            <span className="text-base text-muted-foreground">par</span>
            <Select value={period} onValueChange={(v) => setPeriod(v as AlertPeriod)}>
              <SelectTrigger size="sm" width="auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Option 2: Prix franchit le seuil */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="alertType"
            value="price_threshold"
            checked={alertType === "price_threshold"}
            onChange={() => setAlertType("price_threshold")}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-base">Prix franchit le seuil</span>
        </label>

        {alertType === "price_threshold" && (
          <div className="space-y-2 ml-6">
            <div className="flex items-center gap-2">
              <StepperInput
                value={parseFloat(priceThreshold).toFixed(2)}
                unit={defaultUnit}
                onChange={(newValue) => setPriceThreshold(newValue.toFixed(2))}
                onIncrement={(shift) => {
                  const current = parseFloat(priceThreshold) || 0;
                  const step = shift ? 10 : 1;
                  setPriceThreshold((current + step).toFixed(2));
                }}
                onDecrement={(shift) => {
                  const current = parseFloat(priceThreshold) || 0;
                  const step = shift ? 10 : 1;
                  const newVal = Math.max(0.01, current - step);
                  setPriceThreshold(newVal.toFixed(2));
                }}
                min={0.01}
                className="w-48"
              />
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as PriceDirection)}
              >
                <SelectTrigger size="sm" width="auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(directionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="text-sm text-red-500 space-y-1">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}

      {/* Info message */}
      <div className="flex items-center gap-2 p-3 border border-border rounded text-base text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>Vous recevrez l'alerte sur votre boîte mail.</span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
