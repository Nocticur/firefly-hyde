<script lang="ts">
  import Icon from "@iconify/svelte";

  export let kind: "error" | "warning" | "success" | "info" = "info";
  export let icon: string = "";

  const defaultIcons: Record<string, string> = {
    error: "material-symbols:error-outline-rounded",
    warning: "material-symbols:warning-outline-rounded",
    success: "material-symbols:check-circle-outline-rounded",
    info: "material-symbols:info-outline-rounded",
  };

  $: displayIcon = icon || defaultIcons[kind] || defaultIcons.info;
</script>

<div class="ff-banner ff-banner--{kind}" role="alert">
  <Icon icon={displayIcon} width="19" />
  <slot />
</div>

<style>
  .ff-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.4;
    border: 1px solid transparent;
  }

  .ff-banner--error {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }

  .ff-banner--warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.2);
    color: #fcd34d;
  }

  .ff-banner--success {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }

  .ff-banner--info {
    background: rgba(59, 158, 255, 0.1);
    border-color: rgba(59, 158, 255, 0.2);
    color: #93c5fd;
  }
</style>
