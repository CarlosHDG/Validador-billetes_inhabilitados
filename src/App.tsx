/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Camera, Upload, Scan, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ScanResult {
  denomination: number;
  serial: string;
  series: string;
  is_invalid: boolean;
  is_series_b: boolean;
  range_from?: number;
  range_to?: number;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanBanknote = async () => {
    if (!image) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = image.split(',')[1];
      
      const prompt = `Analyze this image of a Bolivian banknote. 
      1. Identify the denomination (must be 10, 20, 50, 100, or 200).
      2. Extract the serial number (the numeric part).
      3. Extract the series letter (the single letter at the end of the serial number, e.g., 'A', 'B', 'C', etc.).
      Return ONLY a JSON object like this: {"denomination": 10, "serial": "12345678", "series": "B"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      // Clean the response text (remove markdown code blocks if present)
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      // Now validate with the backend
      const validationResponse = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          denomination: data.denomination,
          serial: data.serial,
          series: data.series
        })
      });

      if (!validationResponse.ok) {
        throw new Error("Validation failed");
      }

      const validationResult = await validationResponse.json();
      setResult(validationResult);
    } catch (err) {
      console.error(err);
      setError("No se pudo detectar el billete o el número de serie. Por favor, intenta con una imagen más clara.");
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Scan size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Validador de Billetes</h1>
          </div>
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Bolivia</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Upload Section */}
          {!image ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-dashed border-zinc-200 rounded-3xl p-12 bg-white flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-400 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-lg font-medium">Sube una foto del billete</p>
                <p className="text-sm text-zinc-500">Asegúrate de que el número de serie sea legible</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
              />
              <button className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors">
                Seleccionar Archivo
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-[16/9] shadow-2xl border border-zinc-200">
                <img 
                  src={image} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={reset}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-zinc-900 hover:bg-white transition-colors shadow-sm"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={scanBanknote}
                  disabled={isScanning}
                  className="flex-1 bg-emerald-600 text-white h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Escaneando...</span>
                    </>
                  ) : (
                    <>
                      <Scan size={20} />
                      <span>Escanear Billete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-800"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={`p-6 rounded-3xl border ${result.is_invalid ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.is_invalid ? (
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                          <AlertCircle size={24} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className={`text-lg font-bold ${result.is_invalid ? 'text-red-900' : 'text-emerald-900'}`}>
                          {result.is_invalid ? 'Billete Inhabilitado' : 'Billete Válido'}
                        </h3>
                        <p className={`text-sm ${result.is_invalid ? 'text-red-700' : 'text-emerald-700'}`}>
                          {result.is_invalid 
                            ? 'Este billete pertenece a un rango reportado de la Serie B.' 
                            : (!result.is_series_b 
                              ? `Este billete es de la Serie ${result.series}. Los rangos inhabilitados solo aplican a la Serie B.`
                              : 'No pertenece a rangos inhabilitados de la Serie B.')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black/5">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-40">Corte</p>
                      <p className="text-xl font-mono font-bold">{result.denomination} Bs</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-40">Serie</p>
                      <p className="text-xl font-mono font-bold">{result.series || '?'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-40">Número</p>
                      <p className="text-xl font-mono font-bold tracking-tighter">{result.serial}</p>
                    </div>
                  </div>

                  {result.is_invalid && (
                    <div className="mt-4 p-3 bg-red-100/50 rounded-xl text-xs font-medium text-red-800">
                      Rango detectado: {result.range_from} — {result.range_to} del corte {result.denomination} Bs
                    </div>
                  )}
                </div>

                <button 
                  onClick={reset}
                  className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg"
                >
                  <RefreshCw size={18} />
                  <span>Escanear otro billete</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          :D
        </p>
      </footer>
    </div>
  );
}
