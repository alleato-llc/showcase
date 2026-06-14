// Package model is the Go representation of a showcase project entry. It mirrors
// schema/projects.schema.json — keep the two in agreement (that schema is the
// canonical, cross-language contract).
package model

import (
	"fmt"
	"net/url"
	"strings"
)

// LinkSpec is an explicit labeled link (the general form for several live
// destinations). Kind only sets styling on the site: "live" or "source".
type LinkSpec struct {
	Label string `json:"label"`
	URL   string `json:"url"`
	Kind  string `json:"kind,omitempty"`
}

// Implementation is one variant of a project (e.g. the same tool in another
// language); each renders as a segmented pill.
type Implementation struct {
	Label string `json:"label"`
	Site  string `json:"site,omitempty"`
	Repo  string `json:"repo,omitempty"`
}

// Project is one row of the showcase. Field order matches the JSON we emit.
type Project struct {
	Title           string           `json:"title"`
	Emoji           string           `json:"emoji"`
	Headline        string           `json:"headline"`
	Site            string           `json:"site,omitempty"`
	Repo            string           `json:"repo,omitempty"`
	Links           []LinkSpec       `json:"links,omitempty"`
	Implementations []Implementation `json:"implementations,omitempty"`
}

func isHTTPURL(s string) bool {
	u, err := url.Parse(s)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

// Validate checks one project against the schema rules, returning all problems
// found (empty slice == valid). i is the project's index, for messages.
func (p Project) Validate(i int) []error {
	var errs []error
	at := fmt.Sprintf("project[%d] %q", i+1, p.Title)

	if strings.TrimSpace(p.Title) == "" {
		errs = append(errs, fmt.Errorf("project[%d]: title is required", i+1))
	}
	if strings.TrimSpace(p.Emoji) == "" {
		errs = append(errs, fmt.Errorf("%s: emoji is required", at))
	}
	if strings.TrimSpace(p.Headline) == "" {
		errs = append(errs, fmt.Errorf("%s: headline is required", at))
	}
	if p.Site != "" && !isHTTPURL(p.Site) {
		errs = append(errs, fmt.Errorf("%s: site is not a valid http(s) URL: %q", at, p.Site))
	}
	if p.Repo != "" && !isHTTPURL(p.Repo) {
		errs = append(errs, fmt.Errorf("%s: repo is not a valid http(s) URL: %q", at, p.Repo))
	}
	for j, l := range p.Links {
		if strings.TrimSpace(l.Label) == "" {
			errs = append(errs, fmt.Errorf("%s: links[%d].label is required", at, j))
		}
		if !isHTTPURL(l.URL) {
			errs = append(errs, fmt.Errorf("%s: links[%d].url is not a valid http(s) URL: %q", at, j, l.URL))
		}
		if l.Kind != "" && l.Kind != "live" && l.Kind != "source" {
			errs = append(errs, fmt.Errorf("%s: links[%d].kind must be live|source, got %q", at, j, l.Kind))
		}
	}
	for j, im := range p.Implementations {
		if strings.TrimSpace(im.Label) == "" {
			errs = append(errs, fmt.Errorf("%s: implementations[%d].label is required", at, j))
		}
		if im.Site != "" && !isHTTPURL(im.Site) {
			errs = append(errs, fmt.Errorf("%s: implementations[%d].site is not a valid http(s) URL: %q", at, j, im.Site))
		}
		if im.Repo != "" && !isHTTPURL(im.Repo) {
			errs = append(errs, fmt.Errorf("%s: implementations[%d].repo is not a valid http(s) URL: %q", at, j, im.Repo))
		}
	}
	return errs
}

// Validate checks every project, returning all problems across the set.
func Validate(projects []Project) []error {
	var errs []error
	for i, p := range projects {
		errs = append(errs, p.Validate(i)...)
	}
	return errs
}
