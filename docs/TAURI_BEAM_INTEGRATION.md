# Tauri-BEAM Integration Architecture

## Architecture Overview

```
┌────────────────────────────────────────┐
│ Tauri Application                      │
├────────────────┬───────────────────────┤
│ Frontend (Web) │ Rust Backend          │
│                │                       │
│ ┌──────────┐   │ ┌─────────────────┐  │
│ │React/    │   │ │Rust Core        │  │
│ │Vue/      │◄──┼─┤- State Manager  │  │
│ │Svelte    │   │ │- WASM Modules   │  │
│ └──────────┘   │ │- IPC Handler    │  │
│     ▲          │ └─────────────────┘  │
│     │          │         ▲            │
└─────┼──────────┼─────────┼────────────┘
      │          │         │
      │          │    ┌────┴─────┐
      │          │    │WebSocket │
      │          │    │Protocol  │
      │          │    └────┬─────┘
      │          │         │
┌─────┼──────────┼─────────┼────────────┐
│     │          │         │            │
│  ┌──┴──────────┴─────────┴───────┐    │
│  │        BEAM Core              │    │
│  │                               │    │
│  │  ┌─────────────┐ ┌─────────┐ │    │
│  │  │Phoenix      │ │GenServer│ │    │
│  │  │Channels     │ │Handlers │ │    │
│  │  └─────────────┘ └─────────┘ │    │
│  └───────────────────────────────┘    │
│              BEAM VM                   │
└────────────────────────────────────────┘
```

## Component Integration

### 1. Tauri Frontend
```rust
// src-tauri/src/main.rs
use tauri::{WebviewWindow, WindowBuilder};

#[tauri::command]
async fn connect_beam(window: WebviewWindow) -> Result<(), String> {
    // WebSocket connection to BEAM
    let ws = WebSocket::connect("ws://localhost:4000/ws")
        .await
        .map_err(|e| e.to_string())?;
    
    // Store connection in state
    GLOBAL_STATE.write().await.ws = Some(ws);
    Ok(())
}
```

### 2. WASM Modules
```rust
// src-tauri/src/wasm/compute.rs
#[wasm_bindgen]
pub fn heavy_computation(data: &[u8]) -> Vec<u8> {
    // Perform intensive computation
    // This runs in WASM for better performance
}
```

### 3. BEAM Integration Points

#### Phoenix Channel Setup
```elixir
# lib/veraltheim_web/channels/client_channel.ex
defmodule VeraltheimWeb.ClientChannel do
  use Phoenix.Channel
  
  def join("client:tauri", _params, socket) do
    {:ok, assign(socket, :client_id, generate_id())}
  end
  
  def handle_in("compute_request", payload, socket) do
    # Handle compute requests from Tauri
    result = Veraltheim.ComputeManager.process(payload)
    {:reply, {:ok, result}, socket}
  end
end
```

#### State Synchronization
```elixir
# lib/veraltheim/state_sync.ex
defmodule Veraltheim.StateSync do
  use GenServer
  
  def handle_cast({:state_update, client_id, new_state}, state) do
    # Broadcast state updates to all connected clients
    VeraltheimWeb.Endpoint.broadcast!(
      "client:tauri",
      "state_update",
      %{client_id: client_id, state: new_state}
    )
    {:noreply, state}
  end
end
```

## Communication Patterns

### 1. Real-time Updates
```typescript
// frontend/src/websocket.ts
class BeamConnection {
  socket: Phoenix.Socket;
  channel: Phoenix.Channel;

  async connect() {
    this.socket = new Phoenix.Socket("/socket");
    this.channel = this.socket.channel("client:tauri");
    
    this.channel.on("state_update", payload => {
      store.dispatch(updateState(payload));
    });
  }
}
```

### 2. WASM Computation Flow
```rust
// src-tauri/src/compute.rs
pub async fn handle_computation(data: Vec<u8>) -> Result<Vec<u8>> {
    // 1. Check if computation should be local or remote
    if should_compute_locally(&data) {
        // Use WASM module
        Ok(wasm::compute::heavy_computation(&data))
    } else {
        // Delegate to BEAM
        beam_client::send_compute_request(data).await
    }
}
```

## Development Setup

### 1. Project Structure
```
veraltheim/
├── apps/
│   ├── veraltheim/          # BEAM core application
│   └── veraltheim_web/      # Phoenix web layer
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Tauri main
│   │   ├── compute.rs       # Computation logic
│   │   └── wasm/           # WASM modules
│   └── Cargo.toml
└── frontend/
    ├── src/
    │   ├── main.ts
    │   └── components/
    ├── package.json
    └── index.html
```

### 2. Build Process
```toml
# src-tauri/Cargo.toml
[package]
name = "veraltheim-desktop"
version = "0.1.0"

[dependencies]
tauri = { version = "1.5" }
tokio = { version = "1.0", features = ["full"] }
wasm-bindgen = "0.2"
```

### 3. Development Workflow
1. Start BEAM application
   ```bash
   iex -S mix phx.server
   ```

2. Run Tauri in dev mode
   ```bash
   cd src-tauri
   cargo tauri dev
   ```

## Security Considerations

### 1. Communication Security
- WebSocket connections use TLS
- Message authentication with Phoenix tokens
- Rate limiting on BEAM endpoints

### 2. WASM Security
- Sandboxed execution environment
- Memory isolation
- Resource constraints

### 3. Desktop Security
- Tauri's security model for file system access
- API permissions system
- Secure IPC channels

## Performance Optimizations

### 1. Computation Distribution
- Local WASM for UI-related computations
- BEAM for distributed processing
- Smart routing based on payload size and type

### 2. State Management
- Local state caching
- Efficient delta updates
- Optimistic UI updates

### 3. Resource Management
- Lazy loading of WASM modules
- Memory-conscious state synchronization
- Background processing for heavy computations

## Next Steps

1. **Initial Setup**
   - Create Tauri project structure
   - Set up BEAM WebSocket endpoints
   - Configure build pipeline

2. **Core Features**
   - Implement basic WASM modules
   - Create state synchronization
   - Set up secure communication

3. **UI Development**
   - Design component architecture
   - Implement reactive UI
   - Create development tools

4. **Testing**
   - Unit tests for WASM modules
   - Integration tests for BEAM communication
   - End-to-end testing suite
