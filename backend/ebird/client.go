package ebird

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "https://api.ebird.org/v2"

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func New(apiKey string) *Client {
	return &Client{
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) get(ctx context.Context, path string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+path, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-ebirdapitoken", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ebird returned %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func (c *Client) NotableObs(ctx context.Context, lat, lng float64, dist, back int) ([]byte, error) {
	return c.get(ctx, fmt.Sprintf(
		"/data/obs/geo/recent/notable?lat=%f&lng=%f&dist=%d&back=%d&detail=full&fmt=json",
		lat, lng, dist, back,
	))
}

func (c *Client) Hotspots(ctx context.Context, lat, lng float64, dist int) ([]byte, error) {
	return c.get(ctx, fmt.Sprintf(
		"/ref/hotspot/geo?lat=%f&lng=%f&dist=%d&fmt=json",
		lat, lng, dist,
	))
}

func (c *Client) LocationRecent(ctx context.Context, locId string, back int) ([]byte, error) {
	return c.get(ctx, fmt.Sprintf(
		"/data/obs/%s/recent?back=%d&detail=full&fmt=json",
		locId, back,
	))
}

func (c *Client) Taxonomy(ctx context.Context) ([]byte, error) {
	return c.get(ctx, "/ref/taxonomy/ebird?fmt=json&locale=en")
}

func (c *Client) RecentBySpecies(ctx context.Context, speciesCode string, lat, lng float64, dist, back int) ([]byte, error) {
	return c.get(ctx, fmt.Sprintf(
		"/data/obs/geo/recent/%s?lat=%f&lng=%f&dist=%d&back=%d&detail=full&fmt=json",
		speciesCode, lat, lng, dist, back,
	))
}

func (c *Client) RecentObs(ctx context.Context, lat, lng float64, dist, back int) ([]byte, error) {
	return c.get(ctx, fmt.Sprintf(
		"/data/obs/geo/recent?lat=%f&lng=%f&dist=%d&back=%d&detail=full&fmt=json",
		lat, lng, dist, back,
	))
}
