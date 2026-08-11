import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <div>
            <h1>Comece a crescer</h1>
            <p className="subtitle">Sua Máquina de Leads em poucos passos.</p>
          </div>
        </div>
        <p className="subtitle">Crie seu acesso e transforme nichos de mercado em operações de prospecção.</p>
        {error && <div className="error-box">{error}</div>}
        <label>Nome</label>
        <input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Email</label>
        <input type="email" placeholder="voce@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Senha</label>
        <input type="password" placeholder="Mínimo de 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button type="submit" disabled={loading}>
          {loading ? 'Criando...' : <>Criar minha conta <ArrowRight size={16} /></>}
        </button>
        <p className="switch-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
