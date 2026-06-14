package model

import (
	"fmt"
	"strings"
)

// ThemeColors is a theme's palette — the CSS custom properties the site emits.
type ThemeColors struct {
	Bg      string `json:"bg"`
	Surface string `json:"surface"`
	Text    string `json:"text"`
	Muted   string `json:"muted"`
	Faint   string `json:"faint"`
	Accent  string `json:"accent"`
	Error   string `json:"error"`
	Border  string `json:"border"`
	Shadow  string `json:"shadow"`
}

// Theme is one selectable color theme.
type Theme struct {
	ID     string      `json:"id"`
	Name   string      `json:"name"`
	Mode   string      `json:"mode"` // "light" | "dark"
	Colors ThemeColors `json:"colors"`
}

// Font is one selectable display font. Web fonts carry Family + URL so the site
// can emit an @font-face; system stacks need only Stack.
type Font struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Stack  string `json:"stack"`
	Family string `json:"family,omitempty"`
	URL    string `json:"url,omitempty"`
	Weight string `json:"weight,omitempty"`
}

// ThemeSettings is an instance's themes.json.
type ThemeSettings struct {
	Default     string  `json:"default"`
	DefaultFont string  `json:"defaultFont"`
	Themes      []Theme `json:"themes"`
	Fonts       []Font  `json:"fonts"`
}

// Validate checks a ThemeSettings against schema/themes.schema.json's rules,
// returning all problems found (empty == valid).
func (s ThemeSettings) Validate() []error {
	var errs []error
	if len(s.Themes) == 0 {
		errs = append(errs, fmt.Errorf("themes: at least one theme is required"))
	}
	if len(s.Fonts) == 0 {
		errs = append(errs, fmt.Errorf("fonts: at least one font is required"))
	}

	themeIDs := map[string]bool{}
	for i, t := range s.Themes {
		at := fmt.Sprintf("themes[%d] %q", i, t.Name)
		if strings.TrimSpace(t.ID) == "" {
			errs = append(errs, fmt.Errorf("themes[%d]: id is required", i))
		} else if themeIDs[t.ID] {
			errs = append(errs, fmt.Errorf("%s: duplicate theme id %q", at, t.ID))
		}
		themeIDs[t.ID] = true
		if strings.TrimSpace(t.Name) == "" {
			errs = append(errs, fmt.Errorf("%s: name is required", at))
		}
		if t.Mode != "light" && t.Mode != "dark" {
			errs = append(errs, fmt.Errorf("%s: mode must be light|dark, got %q", at, t.Mode))
		}
		for field, v := range map[string]string{
			"bg": t.Colors.Bg, "surface": t.Colors.Surface, "text": t.Colors.Text,
			"muted": t.Colors.Muted, "faint": t.Colors.Faint, "accent": t.Colors.Accent,
			"error": t.Colors.Error, "border": t.Colors.Border, "shadow": t.Colors.Shadow,
		} {
			if strings.TrimSpace(v) == "" {
				errs = append(errs, fmt.Errorf("%s: colors.%s is required", at, field))
			}
		}
	}

	fontIDs := map[string]bool{}
	for i, f := range s.Fonts {
		at := fmt.Sprintf("fonts[%d] %q", i, f.Name)
		if strings.TrimSpace(f.ID) == "" {
			errs = append(errs, fmt.Errorf("fonts[%d]: id is required", i))
		} else if fontIDs[f.ID] {
			errs = append(errs, fmt.Errorf("%s: duplicate font id %q", at, f.ID))
		}
		fontIDs[f.ID] = true
		if strings.TrimSpace(f.Stack) == "" {
			errs = append(errs, fmt.Errorf("%s: stack is required", at))
		}
	}

	if s.Default != "" && !themeIDs[s.Default] {
		errs = append(errs, fmt.Errorf("default %q is not a theme id", s.Default))
	}
	if s.DefaultFont != "" && !fontIDs[s.DefaultFont] {
		errs = append(errs, fmt.Errorf("defaultFont %q is not a font id", s.DefaultFont))
	}
	return errs
}
