import m from 'mithril';
import { invoke } from "@tauri-apps/api/core";
import './styles.css';

// Tauri command response types
type GreetResponse = string;

// Command interfaces
interface Commands {
  greet: (args: { name: string }) => Promise<GreetResponse>;
}

// Declare commands for type safety
declare global {
  interface Window {
    __TAURI__: {
      invoke: <T extends keyof Commands>(cmd: T, args: Parameters<Commands[T]>[0]) => ReturnType<Commands[T]>;
    }
  }
}

// Types for our components
interface IGreetingAttrs {
  name?: string;
}

interface IGreetingState extends m.CommonLifecycle<IGreetingAttrs> {
  message: string;
}

// Greeting component
const Greeting: m.Component<IGreetingAttrs, IGreetingState> = {
  message: '',
  
  oninit: (vnode) => {
    vnode.state.message = '';
  },

  greet: async (name: string) => {
    try {
      const response = await invoke<GreetResponse>('greet', { name });
      Greeting.message = response;
      m.redraw();
    } catch (error) {
      console.error('Error greeting:', error);
      if (error instanceof Error) {
        Greeting.message = `Error: ${error.message}`;
      } else {
        Greeting.message = 'An unknown error occurred';
      }
      m.redraw();
    }
  },

  view: (vnode) => {
    return m('.greeting', [
      m('form', {
        onsubmit: (e: Event) => {
          e.preventDefault();
          const input = e.target as HTMLFormElement;
          const nameInput = input.querySelector('input[name="name"]') as HTMLInputElement;
          Greeting.greet(nameInput.value);
        }
      }, [
        m('input[type="text"][name="name"]', {
          placeholder: 'Enter a name...',
          value: vnode.attrs.name || '',
          required: true
        }),
        m('button[type="submit"]', 'Greet')
      ]),
      m('.message', Greeting.message || 'Type a name and click Greet')
    ]);
  }
};

// Main App component
const App: m.Component = {
  view: () => {
    return m('.container', [
      m('h1', 'Welcome to Veraltheim'),
      m(Greeting),
      m('p', 'Powered by Tauri + Mithril')
    ]);
  }
};

// Mount our application
m.mount(document.body, App);
