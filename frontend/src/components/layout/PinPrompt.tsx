import { ChangeEvent, FormEvent, useState } from 'react';
import { authenticate } from '../../data/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

const PinPrompt = () => {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { token } = await authenticate(pin);
      login(token);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Unable to verify PIN. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl"
      >
        <div>
          <h2 className="text-xl font-semibold">Committee Access</h2>
          <p className="text-sm text-slate-400">Enter the secure PIN to open the scheduling suite.</p>
        </div>

        <Input
          label="Committee PIN"
          inputMode="numeric"
          value={pin}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPin(event.target.value)}
          placeholder="Enter PIN"
          required
        />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Unlock workspace
        </Button>
      </form>
    </div>
  );
};

export default PinPrompt;
