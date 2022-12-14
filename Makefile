docker-build:
	docker build --tag baselime:latest .

docker-run:
	docker run -it -e BASELIME_API_KEY=yourApiKey -v $(pwd)/.baselime:/workspace/.baselime baselime plan -c /workspace/.baselime