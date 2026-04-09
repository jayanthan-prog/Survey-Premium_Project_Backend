pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DOCKERHUB_CREDENTIALS_ID = 'survey-dockerhub'
        BACKEND_IMAGE = 'pcdpbit/survey-backend'
        IMAGE_TAG_PREFIX = 'v1.0'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Push Backend Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                    sh '''
                        set -e
                        IMAGE_TAG="${IMAGE_TAG_PREFIX}.${BUILD_NUMBER}"

                        echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        docker build --pull -t ${BACKEND_IMAGE}:${IMAGE_TAG} .
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy Backend Stack') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG="${IMAGE_TAG_PREFIX}.${BUILD_NUMBER}"

                    docker network inspect survey_net >/dev/null 2>&1 || docker network create survey_net
                    test -f /opt/envs/.survey_backend.env

                    BACKEND_IMAGE=${BACKEND_IMAGE} IMAGE_TAG=${IMAGE_TAG} docker compose -f docker-compose.backend.yml pull backend
                    BACKEND_IMAGE=${BACKEND_IMAGE} IMAGE_TAG=${IMAGE_TAG} docker compose -f docker-compose.backend.yml up -d --remove-orphans
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo 'Backend deployment completed successfully.'
        }
        failure {
            echo 'Backend deployment failed.'
        }
    }
}
