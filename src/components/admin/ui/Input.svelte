<script lang="ts">
  export let label: string = "";
  export let type: "text" | "password" | "email" = "text";
  export let placeholder: string = "";
  export let value: string = "";
  export let autocomplete: string = "";
  export let error: string = "";
  export let id: string = "";
  export let onkeydown: (e: KeyboardEvent) => void = () => {};

  function handleKeydown(e: KeyboardEvent) {
    onkeydown(e);
  }
</script>

<div class="ff-input-wrap" class:ff-input-wrap--error={!!error}>
  {#if label}
    <label class="ff-input-label" for={id}>{label}</label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {autocomplete}
    bind:value
    on:keydown={handleKeydown}
    class="ff-input"
    aria-invalid={!!error}
  />
  {#if error}
    <p class="ff-input-error" role="alert">{error}</p>
  {/if}
</div>

<style>
  .ff-input-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ff-input-label {
    color: #94a3b8;
    font-size: 13px;
    font-weight: 650;
  }

  .ff-input {
    width: 100%;
    height: 44px;
    padding: 0 18px;
    border: 1.5px solid rgba(91, 168, 232, 0.12);
    border-radius: 10px;
    background: rgba(17, 25, 40, 0.6);
    color: #e2e8f0;
    font-size: 14px;
    outline: none;
    color-scheme: dark;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      background 120ms ease;
  }

  .ff-input::placeholder {
    color: #4b5563;
  }

  .ff-input:focus {
    border-color: rgba(91, 168, 232, 0.4);
    box-shadow: 0 0 0 3px rgba(59, 158, 255, 0.1);
    background: rgba(17, 25, 40, 0.8);
  }

  .ff-input-wrap--error .ff-input {
    border-color: rgba(239, 68, 68, 0.5);
  }
  .ff-input-wrap--error .ff-input:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .ff-input-error {
    margin: 0;
    color: #ef4444;
    font-size: 12px;
  }
</style>
