<script lang="ts" setup>
import { computed, nextTick } from 'vue';

import { $t } from '@vben/locales';

interface Props {
  /**
   * 类型
   */
  type?: 'icon' | 'normal';
}

defineOptions({
  name: 'ThemeToggleButton',
});

defineProps<Props>();

const isDark = defineModel<boolean>();

const themeLabel = computed(() => {
  return isDark.value
    ? $t('preferences.theme.light')
    : $t('preferences.theme.dark');
});

function toggleTheme(event: MouseEvent) {
  const nextIsDark = !isDark.value;
  const isAppearanceTransition =
    event.detail > 0 &&
    // @ts-expect-error - startViewTransition is not available in the current DOM lib target
    document.startViewTransition &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isAppearanceTransition) {
    isDark.value = nextIsDark;
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const transition = document.startViewTransition(async () => {
    isDark.value = nextIsDark;
    await nextTick();
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];
    const animation = document.documentElement.animate(
      {
        clipPath: nextIsDark ? [...clipPath].toReversed() : clipPath,
      },
      {
        duration: 450,
        easing: 'ease-in',
        pseudoElement: nextIsDark
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      },
    );

    animation.onfinish = () => {
      transition.skipTransition();
    };
  });
}
</script>

<template>
  <label
    :title="themeLabel"
    class="theme-switch"
    @click.prevent.stop="toggleTheme"
  >
    <input
      :aria-label="themeLabel"
      :checked="isDark"
      class="theme-switch__input"
      type="checkbox"
    />
    <span class="theme-switch__slider">
      <span class="theme-switch__sun-moon">
        <svg
          aria-hidden="true"
          class="moon-dot moon-dot--one"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="moon-dot moon-dot--two"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="moon-dot moon-dot--three"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>

        <svg
          aria-hidden="true"
          class="light-ray light-ray--one"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="light-ray light-ray--two"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="light-ray light-ray--three"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>

        <svg
          aria-hidden="true"
          class="cloud cloud--dark cloud--one"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="cloud cloud--dark cloud--two"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="cloud cloud--dark cloud--three"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="cloud cloud--light cloud--four"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="cloud cloud--light cloud--five"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          aria-hidden="true"
          class="cloud cloud--light cloud--six"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
      </span>

      <span class="stars">
        <svg aria-hidden="true" class="star star--one" viewBox="0 0 20 20">
          <path
            d="M 0 10 C 10 10, 10 10, 0 10 C 10 10, 10 10, 10 20 C 10 10, 10 10, 20 10 C 10 10, 10 10, 10 0 C 10 10, 10 10, 0 10 Z"
          />
        </svg>
        <svg aria-hidden="true" class="star star--two" viewBox="0 0 20 20">
          <path
            d="M 0 10 C 10 10, 10 10, 0 10 C 10 10, 10 10, 10 20 C 10 10, 10 10, 20 10 C 10 10, 10 10, 10 0 C 10 10, 10 10, 0 10 Z"
          />
        </svg>
        <svg aria-hidden="true" class="star star--three" viewBox="0 0 20 20">
          <path
            d="M 0 10 C 10 10, 10 10, 0 10 C 10 10, 10 10, 10 20 C 10 10, 10 10, 20 10 C 10 10, 10 10, 10 0 C 10 10, 10 10, 0 10 Z"
          />
        </svg>
        <svg aria-hidden="true" class="star star--four" viewBox="0 0 20 20">
          <path
            d="M 0 10 C 10 10, 10 10, 0 10 C 10 10, 10 10, 10 20 C 10 10, 10 10, 20 10 C 10 10, 10 10, 10 0 C 10 10, 10 10, 0 10 Z"
          />
        </svg>
      </span>
    </span>
  </label>
</template>

<style scoped>
.theme-switch {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 39px;
  height: 22px;
  vertical-align: middle;
}

.theme-switch__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.theme-switch__slider {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 60px;
  height: 34px;
  overflow: hidden;
  cursor: pointer;
  background-color: #2196f3;
  border-radius: 34px;
  transform: scale(0.65);
  transform-origin: top left;
  transition: background-color 0.4s;
}

.theme-switch__sun-moon {
  position: absolute;
  bottom: 4px;
  left: 4px;
  z-index: 1;
  width: 26px;
  height: 26px;
  background-color: #ffeb3b;
  border-radius: 50%;
  transition:
    background-color 0.4s,
    transform 0.4s;
}

.theme-switch__input:checked + .theme-switch__slider {
  background-color: #111827;
}

.theme-switch__input:focus-visible + .theme-switch__slider {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

.theme-switch__input:checked + .theme-switch__slider .theme-switch__sun-moon {
  background-color: #fff;
  transform: translateX(26px);
  animation: rotate-center 0.6s ease-in-out both;
}

.moon-dot {
  position: absolute;
  z-index: 4;
  opacity: 0;
  fill: #808080;
  transition: opacity 0.4s;
}

.theme-switch__input:checked + .theme-switch__slider .moon-dot {
  opacity: 1;
}

.moon-dot--one {
  top: 3px;
  left: 10px;
  width: 6px;
  height: 6px;
}

.moon-dot--two {
  top: 10px;
  left: 2px;
  width: 10px;
  height: 10px;
}

.moon-dot--three {
  top: 18px;
  left: 16px;
  width: 3px;
  height: 3px;
}

.light-ray {
  position: absolute;
  z-index: -1;
  opacity: 0.1;
  fill: #fff;
}

.light-ray--one {
  top: -8px;
  left: -8px;
  width: 43px;
  height: 43px;
}

.light-ray--two {
  top: -50%;
  left: -50%;
  width: 55px;
  height: 55px;
}

.light-ray--three {
  top: -18px;
  left: -18px;
  width: 60px;
  height: 60px;
}

.cloud {
  position: absolute;
  animation: cloud-move 6s infinite;
}

.cloud--dark {
  fill: #ccc;
  animation-delay: 1s;
}

.cloud--light {
  fill: #eee;
}

.cloud--one {
  top: 15px;
  left: 30px;
  width: 40px;
}

.cloud--two {
  top: 10px;
  left: 44px;
  width: 20px;
}

.cloud--three {
  top: 24px;
  left: 18px;
  width: 30px;
}

.cloud--four {
  top: 18px;
  left: 36px;
  width: 40px;
}

.cloud--five {
  top: 14px;
  left: 48px;
  width: 20px;
}

.cloud--six {
  top: 26px;
  left: 22px;
  width: 30px;
}

.stars {
  opacity: 0;
  transform: translateY(-32px);
  transition:
    opacity 0.4s,
    transform 0.4s;
}

.star {
  position: absolute;
  fill: #fff;
  animation: star-twinkle 2s infinite;
}

.theme-switch__input:checked + .theme-switch__slider .stars {
  opacity: 1;
  transform: translateY(0);
}

.star--one {
  top: 2px;
  left: 3px;
  width: 20px;
  animation-delay: 0.3s;
}

.star--two {
  top: 16px;
  left: 3px;
  width: 6px;
}

.star--three {
  top: 20px;
  left: 10px;
  width: 12px;
  animation-delay: 0.6s;
}

.star--four {
  top: 0;
  left: 18px;
  width: 18px;
  animation-delay: 1.3s;
}

@keyframes rotate-center {
  from {
    transform: translateX(0) rotate(0);
  }

  to {
    transform: translateX(26px) rotate(360deg);
  }
}

@keyframes cloud-move {
  0%,
  100% {
    transform: translateX(0);
  }

  40% {
    transform: translateX(4px);
  }

  80% {
    transform: translateX(-4px);
  }
}

@keyframes star-twinkle {
  0%,
  100% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.2);
  }

  80% {
    transform: scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch__slider,
  .theme-switch__sun-moon,
  .moon-dot,
  .stars {
    transition: none;
  }

  .theme-switch__sun-moon,
  .cloud,
  .star {
    animation: none;
  }
}
</style>
