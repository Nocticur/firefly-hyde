<script lang="ts">
  import Icon from "@iconify/svelte";

  export let variant: "primary" | "secondary" | "ghost" | "danger" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let icon: string = "";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled = false;
  export let loading = false;
  export let className = "";
</script>

<button
  {type}
  {disabled}
  class="ff-btn ff-btn--{variant} ff-btn--{size} {className}"
  class:ff-btn--loading={loading}
  on:click
  {...$$restProps}
>
  {#if loading}
    <span class="ff-btn__spinner" aria-hidden="true"></span>
  {:else if icon}
    <Icon {icon} width={size === "sm" ? 16 : size === "lg" ? 22 : 19} />
  {/if}
  <slot />
</button>

<style>
  .ff-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 10px;
    font-weight: 650;
    cursor: pointer;
    white-space: nowrap;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      background 120ms ease,
      border-color 120ms ease;
  }
  .ff-btn:disabled {
    opacity: 0.45;
    cursor: wait;
  }
  .ff-btn:not(:disabled):hover {
    transform: translateY(-1px);
  }
  .ff-btn:not(:disabled):active {
    transform: translateY(0) scale(0.98);
  }

  /* ── Sizes ── */
  .ff-btn--sm {
    min-height: 32px;
    padding: 0 10px;
    font-size: 12px;
  }
  .ff-btn--md {
    min-height: 38px;
    padding: 0 14px;
    font-size: 13px;
  }
  .ff-btn--lg {
    min-height: 44px;
    padding: 0 18px;
    font-size: 14px;
  }

  /* ── Primary ── */
  .ff-btn--primary {
    background: #3b9eff;
    color: white;
    border-color: #3b9eff;
    box-shadow: 0 0 16px rgba(59, 158, 255, 0.2);
  }
  .ff-btn--primary:not(:disabled):hover {
    background: #5ba8e8;
    border-color: #5ba8e8;
    box-shadow: 0 0 24px rgba(59, 158, 255, 0.3);
  }

  /* ── Secondary ── */
  .ff-btn--secondary {
    background: rgba(17, 25, 40, 0.6);
    color: #94a3b8;
    border-color: rgba(91, 168, 232, 0.12);
  }
  .ff-btn--secondary:not(:disabled):hover {
    border-color: rgba(91, 168, 232, 0.3);
    color: #3b9eff;
    background: rgba(91, 168, 232, 0.06);
  }

  /* ── Ghost ── */
  .ff-btn--ghost {
    background: transparent;
    color: #94a3b8;
    border-color: transparent;
  }
  .ff-btn--ghost:not(:disabled):hover {
    background: rgba(91, 168, 232, 0.06);
    color: #3b9eff;
  }

  /* ── Danger ── */
  .ff-btn--danger {
    background: transparent;
    color: #ef4444;
    border-color: rgba(91, 168, 232, 0.1);
  }
  .ff-btn--danger:not(:disabled):hover {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.3);
  }

  /* ── Loading spinner ── */
  .ff-btn__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ff-spin 0.6s linear infinite;
  }
  @keyframes ff-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
