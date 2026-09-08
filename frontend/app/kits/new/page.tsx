'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { api } from '@/lib/api';
import { extractCompanyUrlsFromJd } from '@/lib/extractUrls';
import { Sparkles, Upload, FileText, Calendar, Link as LinkIcon, Loader2, AlertCircle, Table, Check, Globe, Mail } from 'lucide-react';

interface BatchRow {
  jd: string;
  company_url?: string;
  days?: number;
  status?: 'pending' | 'generating' | 'done' | 'failed';
  error?: string;
}

export default function NewKitPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Single mode state
  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch mode state
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Auto-extract URL landing page suggestions from JD
  const urlSuggestions = useMemo(() => extractCompanyUrlsFromJd(jd), [jd]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jd.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.kits.generate({
        jd: jd.trim(),
        company_url: companyUrl.trim() || undefined,
        days: Number(days) || 7,
      });

      if (response.kit?._id) {
        router.push(`/kits/${response.kit._id}`);
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate kit. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = (results.data as Record<string, string>[]).map((row) => ({
            jd: row.jd || row.job_description || row.JD || '',
            company_url: row.company_url || row.url || row.company || '',
            days: parseInt(row.days || row.days_until_interview || '7', 10) || 7,
            status: 'pending' as const,
          }));

          const validRows = parsed.filter((r) => r.jd.length > 0);
          if (validRows.length === 0) {
            setFileError('CSV must contain a "jd" or "job_description" column.');
          } else {
            setBatchRows(validRows);
          }
        },
        error: (err) => {
          setFileError(`CSV Parse Error: ${err.message}`);
        },
      });
    } else if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const list = Array.isArray(json) ? json : [json];
          const parsed: BatchRow[] = (list as Record<string, string>[]).map((item) => ({
            jd: item.jd || item.job_description || '',
            company_url: item.company_url || item.url || '',
            days: parseInt(item.days || '7', 10) || 7,
            status: 'pending' as const,
          }));

          const validRows = parsed.filter((r) => r.jd.length > 0);
          if (validRows.length === 0) {
            setFileError('JSON must contain objects with a "jd" field.');
          } else {
            setBatchRows(validRows);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Invalid JSON file';
          setFileError(`JSON Parse Error: ${message}`);
        }
      };
      reader.readAsText(file);
    } else {
      setFileError('Please upload a valid .csv or .json file.');
    }
  };

  const handleBatchSubmit = async () => {
    if (batchRows.length === 0) return;
    setBatchProcessing(true);

    const updatedRows = [...batchRows];

    for (let i = 0; i < updatedRows.length; i++) {
      updatedRows[i].status = 'generating';
      setBatchRows([...updatedRows]);

      try {
        await api.kits.generate({
          jd: updatedRows[i].jd,
          company_url: updatedRows[i].company_url || undefined,
          days: updatedRows[i].days || 7,
        });
        updatedRows[i].status = 'done';
      } catch (err: unknown) {
        updatedRows[i].status = 'failed';
        updatedRows[i].error = err instanceof Error ? err.message : 'Generation failed';
      }
      setBatchRows([...updatedRows]);
    }

    setBatchProcessing(false);
    // Redirect to dashboard after batch complete
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/25 mb-2">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Generate Interview Prep Kit</h1>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          AI will analyze the job role, research company culture & engineering principles, and construct your personalized study suite.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'single'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Single JD</span>
          </button>

          <button
            onClick={() => setMode('batch')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'batch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table className="h-4 w-4" />
            <span>Batch Upload</span>
          </button>
        </div>
      </div>

      {/* SINGLE MODE FORM */}
      {mode === 'single' && (
        <form
          onSubmit={handleSingleSubmit}
          className="space-y-6 bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl shadow-2xl"
        >
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-zinc-300">Job Description (JD) *</label>
              <span className="text-xs text-zinc-500">{jd.length} chars</span>
            </div>
            <textarea
              required
              rows={8}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description text here..."
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Company Careers / URL (Optional)</span>
              </label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://company.com/about"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
              />

              {urlSuggestions.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                    <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                    <span>Suggested Landing Pages from JD:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {urlSuggestions.map((sug) => {
                      const isSelected = companyUrl === sug.url;
                      return (
                        <button
                          key={sug.url}
                          type="button"
                          onClick={() => setCompanyUrl(sug.url)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30 font-semibold'
                              : 'bg-zinc-900/90 text-indigo-200 border-zinc-700/80 hover:bg-zinc-800 hover:border-indigo-500/40'
                          }`}
                        >
                          {sug.sourceType === 'email' ? (
                            <Mail className="h-3 w-3 shrink-0 text-purple-400" />
                          ) : (
                            <Globe className="h-3 w-3 shrink-0 text-indigo-400" />
                          )}
                          <span>{sug.url}</span>
                          {sug.sourceType === 'email' && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-sans">
                              from email
                            </span>
                          )}
                          {isSelected && <Check className="h-3 w-3 ml-0.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Days Until Interview</span>
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 7)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:shadow-indigo-500/35 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Prep Kit...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Prep Kit</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* BATCH MODE FORM */}
      {mode === 'batch' && (
        <div className="space-y-6 bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl shadow-2xl">
          {fileError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {batchRows.length === 0 ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/40 rounded-2xl p-10 cursor-pointer transition-colors text-center group">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-zinc-200">Upload JSON or CSV File</span>
              <span className="text-xs text-zinc-500 mt-1">Columns: jd, company_url, days</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Parsed Batch List ({batchRows.length} items)</h3>
                <button
                  onClick={() => setBatchRows([])}
                  disabled={batchProcessing}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                >
                  Reset File
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Job Description</th>
                      <th className="px-4 py-2.5">Company URL</th>
                      <th className="px-4 py-2.5">Days</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {batchRows.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-900/50">
                        <td className="px-4 py-3 font-mono text-zinc-500">{i + 1}</td>
                        <td className="px-4 py-3 max-w-xs truncate font-mono text-zinc-200">
                          {row.jd}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-zinc-400">
                          {row.company_url || '—'}
                        </td>
                        <td className="px-4 py-3">{row.days || 7}d</td>
                        <td className="px-4 py-3 text-right">
                          {row.status === 'pending' && <span className="text-zinc-500">Pending</span>}
                          {row.status === 'generating' && (
                            <span className="text-amber-400 inline-flex items-center gap-1 font-medium">
                              <Loader2 className="h-3 w-3 animate-spin" /> Generating
                            </span>
                          )}
                          {row.status === 'done' && (
                            <span className="text-emerald-400 inline-flex items-center gap-1 font-medium">
                              <Check className="h-3 w-3" /> Done
                            </span>
                          )}
                          {row.status === 'failed' && (
                            <span className="text-rose-400 font-medium">{row.error || 'Failed'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleBatchSubmit}
                disabled={batchProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {batchProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Submit Batch ({batchRows.length} kits)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
