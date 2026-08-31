import { useState } from 'react'
import { MessageCircle, Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const CANNED_RESPONSES: Record<string, string> = {
  default:
    'I am analyzing the current mission state. Based on the latest telemetry from Astra-1, ' +
    'the most pressing concern is the drill vibration anomaly (anom-002). I recommend suspending ' +
    'drill operations until the bit integrity diagnostic completes. The battery self-discharge ' +
    'trend is secondary but warrants monitoring. Shall I generate a prioritized action list?',
  battery:
    'The battery self-discharge anomaly shows a 14% faster drain than the thermal model predicts. ' +
    'Root cause is likely early SEI layer thickening in cell group C3. Recommended actions: (1) reduce ' +
    'payload power by 12W, (2) schedule conditioning cycle within 96h, (3) increase heater setpoint +3°C. ' +
    'Failure probability in 35 days: 68% (CI: 51–81%).',
  drill:
    'The 47 Hz resonance signature on the drill spindle is consistent with either bit wear past the ' +
    'safe operating envelope or sub-surface basalt contact. At 94 operating hours (vs 120h rated), ' +
    'continued operation without inspection risks spindle bearing seizure. I have already initiated ' +
    'the Drill Suspension Protocol. Awaiting ground confirmation to resume.',
  health:
    'Overall rover health is 82/100. Component breakdown: Nav (99), Comms (97), Drive (94), ' +
    'Solar (88), Thermal (79), Battery (71), Drill (63). The two degraded components are driving ' +
    'the warning-level system status. With Battery Conservation Protocol Alpha approved, expected ' +
    'health would improve to ~86/100 within 48 hours.',
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('battery') || lower.includes('charge') || lower.includes('power'))
    return CANNED_RESPONSES.battery
  if (lower.includes('drill') || lower.includes('vibrat') || lower.includes('sample'))
    return CANNED_RESPONSES.drill
  if (lower.includes('health') || lower.includes('status') || lower.includes('overview'))
    return CANNED_RESPONSES.health
  return CANNED_RESPONSES.default
}

export function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm0',
      role: 'assistant',
      content:
        'AstraTwin AI Copilot online. I have full visibility into Astra-1\'s current mission state, ' +
        'telemetry, anomalies, and predictive models. I currently see 2 open anomalies requiring attention. ' +
        'How can I assist you today?',
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  function sendMessage() {
    if (!input.trim()) return
    const userMsg: Message = {
      id: `m${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = getResponse(userMsg.content)
      setMessages((m) => [
        ...m,
        { id: `m${Date.now() + 1}`, role: 'assistant', content: response, timestamp: new Date().toISOString() },
      ])
      setIsTyping(false)
    }, 1200)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          >
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100">AI Copilot</h1>
            <p className="text-xs text-gray-500">Mission-aware AI assistant for Astra-1</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <span className="live-dot" style={{ backgroundColor: '#10b981' }} />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={
                msg.role === 'assistant'
                  ? { background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }
                  : { backgroundColor: 'rgba(255,255,255,0.1)' }
              }
            >
              {msg.role === 'assistant' ? (
                <Bot size={13} className="text-white" />
              ) : (
                <User size={13} className="text-gray-300" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user' ? 'text-gray-200' : 'text-gray-300'
              }`}
              style={{
                backgroundColor:
                  msg.role === 'assistant'
                    ? 'rgba(6,182,212,0.07)'
                    : 'rgba(255,255,255,0.06)',
                border: `1px solid ${msg.role === 'assistant' ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Bot size={13} className="text-cyan-500" />
            <span>AstraTwin is thinking</span>
            <span className="animate-pulse">...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about battery health, anomalies, mission status..."
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: input.trim() && !isTyping ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
              color: input.trim() && !isTyping ? '#06b6d4' : '#6b7280',
              border: `1px solid ${input.trim() && !isTyping ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-[10px] text-gray-700 mt-1.5 text-center">
          Responses are simulated — this prototype does not connect to a live AI model
        </div>
      </div>
    </div>
  )
}
