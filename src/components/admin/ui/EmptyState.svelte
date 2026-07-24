<script lang="ts">
  import Icon from "@iconify/svelte";

  export let icon: string = "mingcute:box-line";
  export let title: string = "";
  export let description: string = "";
  export let actionLabel: string = "";
  export let onAction: (() => void) | undefined = undefined;
</script>

<div class="ff-empty">
  <div class="ff-empty__icon">
    <Icon {icon} width="40" />
  </div>
  {#if title}
    <h2 class="ff-empty__title">{title}</h2>
  {/if}
  {#if description}
    <p class="ff-empty__desc">{description}</p>
  {/if}
  {#if actionLabel && onAction}
    <button class="ff-empty__action" onclick={onAction}>{actionLabel}</button>
  {/if}
</div>

<style>
  .ff-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    text-align: center;
  }

  .ff-empty__icon {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(91, 168, 232, 0.08);
    color: #3b9eff;
    margin-bottom: 16px;
  }

  .ff-empty__title {
    margin: 0 0 8px;
    font-family: var(--ff-font-cute, "Chikushi Maru", cursive);
    font-size: 18px;
    color: #e2e8f0;
  }

  .ff-empty__desc {
    max-width: 400px;
    margin: 0 0 24px;
    color: #64748b;
    line-height: 1.6;
    font-size: 13px;
  }

  .ff-empty__action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid #3b9eff;
    border-radius: 10px;
    background: #3b9eff;
    color: white;
    font-weight: 650;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 0 16px rgba(59, 158, 255, 0.2);
    transition:
      transform 120ms ease,
      background 120ms ease,
      box-shadow 120ms ease;
  }
  .ff-empty__action:hover {
    transform: translateY(-1px);
    background: #5ba8e8;
    box-shadow: 0 0 24px rgba(59, 158, 255, 0.3);
  }
  .ff-empty__action:active {
    transform: translateY(0) scale(0.98);
  }
</style>
