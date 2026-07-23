{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };

        nodeVersionRaw = pkgs.lib.strings.trim (builtins.readFile ./.node-version);
        nodeMajorVersion = builtins.head (builtins.match "v?([0-9]+).*" nodeVersionRaw);
        node = pkgs."nodejs_${nodeMajorVersion}";

        buildInputs = with pkgs; [
          node
          corepack
        ];

        nativeBuildInputs = with pkgs; [ ];
      in
      {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs =
            with pkgs;
            [
              nil
              ripgrep
            ]
            ++ nativeBuildInputs;

          buildInputs = buildInputs;
        };
      }
    );
}
